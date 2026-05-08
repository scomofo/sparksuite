#!/usr/bin/env node
/*
 * SparkSuite lesson A/V smoke tests
 *
 * Validates lesson assets described by lessons/**/manifest.json.
 * Designed to fail with teacher-friendly messages rather than raw stack traces.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execa } from 'execa';
import mm from 'music-metadata';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const lessonsRoot = path.join(repoRoot, 'lessons');
const DURATION_TOLERANCE_SECONDS = 2;
const SRT_END_TOLERANCE_SECONDS = 0.5;
const SILENCE_PEAK_THRESHOLD_DBFS = -40;

const failures = [];

function rel(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, '/');
}

function fail(message, artifactPath, hint) {
  failures.push({ message, artifactPath, hint });
  console.error(`❌ ${message}`);
  if (artifactPath) console.error(`   Open: ${rel(artifactPath)}`);
  if (hint) console.error(`   Hint: ${hint}`);
}

function pass(message) {
  console.log(`✅ ${message}`);
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function findManifestDirs(root) {
  if (!(await exists(root))) return [];

  const found = [];

  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    if (entries.some((entry) => entry.isFile() && entry.name === 'manifest.json')) {
      found.push(dir);
      return;
    }

    await Promise.all(
      entries
        .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
        .map((entry) => walk(path.join(dir, entry.name)))
    );
  }

  await walk(root);
  return found.sort();
}

async function readJson(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8'));
  } catch (error) {
    fail(`Invalid JSON in ${rel(filePath)}`, filePath, 'Fix the JSON syntax in manifest.json');
    return null;
  }
}

async function pdfPageCount(filePath) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const data = new Uint8Array(await fs.readFile(filePath));
  const doc = await pdfjs.getDocument({ data, disableWorker: true }).promise;
  const pages = doc.numPages;
  await doc.destroy();
  return pages;
}

async function readAudioMetadata(filePath) {
  return mm.parseFile(filePath, { duration: true });
}

async function ffmpegVolumedetect(filePath) {
  const result = await execa(
    'ffmpeg',
    ['-hide_banner', '-nostats', '-i', filePath, '-af', 'volumedetect', '-f', 'null', '-'],
    { reject: false, all: true }
  );
  const output = result.all || '';
  const mean = output.match(/mean_volume:\s*(-?\d+(?:\.\d+)?) dB/);
  const max = output.match(/max_volume:\s*(-?\d+(?:\.\d+)?) dB/);
  return {
    meanDbfs: mean ? Number.parseFloat(mean[1]) : null,
    maxDbfs: max ? Number.parseFloat(max[1]) : null,
    output
  };
}

function parseSrtTime(hh, mm, ss, ms) {
  return Number(hh) * 3600 + Number(mm) * 60 + Number(ss) + Number(ms) / 1000;
}

function parseSrtTimings(srt) {
  return [...srt.matchAll(/(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/g)].map((match) => ({
    start: parseSrtTime(match[1], match[2], match[3], match[4]),
    end: parseSrtTime(match[5], match[6], match[7], match[8])
  }));
}

async function checkRequiredFile(baseDir, filename, label) {
  if (!filename) {
    fail(`Missing ${label} filename in manifest`, path.join(baseDir, 'manifest.json'), `Set the ${label} field in manifest.json`);
    return null;
  }

  const filePath = path.join(baseDir, filename);
  if (!(await exists(filePath))) {
    fail(`Missing ${label}: ${filename}`, filePath, 'Export or copy the expected lesson asset into this lesson folder');
    return null;
  }
  return filePath;
}

function checkManifestBasics(manifest, manifestPath) {
  for (const field of ['lesson_id', 'title', 'tempo_bpm', 'time_signature', 'key', 'duration_s']) {
    if (manifest[field] === undefined || manifest[field] === null || manifest[field] === '') {
      fail(`manifest.${field} is missing`, manifestPath, `Add ${field} to manifest.json`);
    }
  }

  if (!manifest.audio?.sample_rate_hz) {
    fail('manifest.audio.sample_rate_hz is missing', manifestPath, 'Set audio.sample_rate_hz to 44100');
  }

  if (!manifest.audio?.bit_depth) {
    fail('manifest.audio.bit_depth is missing', manifestPath, 'Set audio.bit_depth to 16');
  }
}

async function checkPdf(baseDir, manifest) {
  const pdfPath = await checkRequiredFile(baseDir, manifest.pdf?.file, 'PDF');
  if (!pdfPath) return;

  try {
    const pages = await pdfPageCount(pdfPath);
    if (pages !== manifest.pdf.expected_pages) {
      fail(
        `Lead sheet is ${pages} pages (expected ${manifest.pdf.expected_pages})`,
        pdfPath,
        'Reduce spacing/font size or update manifest.pdf.expected_pages only if intentional'
      );
    } else {
      pass(`${rel(pdfPath)} page count OK`);
    }
  } catch (error) {
    fail(`Could not read PDF page count: ${error.message}`, pdfPath, 'Re-export the PDF and ensure it opens normally');
  }

  if (manifest.pdf?.expected_key && manifest.key && manifest.pdf.expected_key !== manifest.key) {
    fail(
      `PDF expected key ${manifest.pdf.expected_key} does not match manifest key ${manifest.key}`,
      pdfPath,
      'Update manifest.key or manifest.pdf.expected_key so they agree'
    );
  }
}

async function checkWav(baseDir, manifest) {
  const wavPath = await checkRequiredFile(baseDir, manifest.audio?.wav, 'WAV');
  if (!wavPath) return null;

  try {
    const metadata = await readAudioMetadata(wavPath);
    const sampleRate = metadata.format.sampleRate;
    const bitDepth = metadata.format.bitsPerSample;
    const duration = metadata.format.duration || 0;

    if (sampleRate !== manifest.audio.sample_rate_hz) {
      fail(`WAV sample rate ${sampleRate} Hz — expected ${manifest.audio.sample_rate_hz} Hz`, wavPath, 'Re-export to 44.1kHz');
    } else {
      pass(`${rel(wavPath)} sample rate OK`);
    }

    if (bitDepth && bitDepth !== manifest.audio.bit_depth) {
      fail(`WAV bit depth ${bitDepth} — expected ${manifest.audio.bit_depth}`, wavPath, 'Export 16-bit PCM');
    } else if (bitDepth) {
      pass(`${rel(wavPath)} bit depth OK`);
    }

    if (Math.abs(duration - manifest.duration_s) > DURATION_TOLERANCE_SECONDS) {
      fail(
        `WAV duration ${duration.toFixed(1)}s != ${manifest.duration_s}s ±${DURATION_TOLERANCE_SECONDS}s`,
        wavPath,
        'Trim the DAW tail or update manifest.duration_s if intentional'
      );
    } else {
      pass(`${rel(wavPath)} duration OK`);
    }

    const volume = await ffmpegVolumedetect(wavPath);
    const minRms = manifest.rms_dbfs_target?.min ?? -18;
    const maxRms = manifest.rms_dbfs_target?.max ?? -10;

    if (volume.meanDbfs === null || volume.meanDbfs < minRms || volume.meanDbfs > maxRms) {
      fail(`WAV RMS ${volume.meanDbfs ?? 'n/a'} dBFS not in [${minRms}, ${maxRms}]`, wavPath, 'Normalize or compress the mix stem');
    } else {
      pass(`${rel(wavPath)} RMS OK`);
    }

    if (volume.maxDbfs === null || volume.maxDbfs < SILENCE_PEAK_THRESHOLD_DBFS) {
      fail('WAV peak too low — possible silence or broken bounce', wavPath, 'Check master bus routing and export source');
    } else {
      pass(`${rel(wavPath)} audible peak OK`);
    }

    return { path: wavPath, duration };
  } catch (error) {
    fail(`Could not inspect WAV: ${error.message}`, wavPath, 'Confirm ffmpeg is installed and the WAV is valid PCM');
    return null;
  }
}

async function checkMp3(baseDir, manifest, wavInfo) {
  const mp3Path = await checkRequiredFile(baseDir, manifest.audio?.mp3, 'MP3');
  if (!mp3Path) return;

  try {
    const metadata = await readAudioMetadata(mp3Path);
    const sampleRate = metadata.format.sampleRate;
    const duration = metadata.format.duration || 0;

    if (sampleRate !== manifest.audio.sample_rate_hz) {
      fail(`MP3 sample rate ${sampleRate} Hz — expected ${manifest.audio.sample_rate_hz} Hz`, mp3Path, 'Re-export the MP3 to 44.1kHz');
    } else {
      pass(`${rel(mp3Path)} sample rate OK`);
    }

    const targetDuration = wavInfo?.duration ?? manifest.duration_s;
    if (Math.abs(duration - targetDuration) > DURATION_TOLERANCE_SECONDS) {
      fail(`MP3 duration ${duration.toFixed(1)}s does not match WAV/manifest`, mp3Path, 'Export MP3 from the final WAV master');
    } else {
      pass(`${rel(mp3Path)} duration OK`);
    }
  } catch (error) {
    fail(`Could not inspect MP3: ${error.message}`, mp3Path, 'Re-export the MP3 preview');
  }
}

async function checkSrt(baseDir, manifest, wavInfo) {
  const srtPath = await checkRequiredFile(baseDir, manifest.captions?.srt, 'SRT');
  if (!srtPath) return;

  try {
    const srt = await fs.readFile(srtPath, 'utf8');
    const cues = parseSrtTimings(srt);
    const audioDuration = wavInfo?.duration ?? manifest.duration_s;

    if (!cues.length) {
      fail('SRT has no valid cues', srtPath, 'Add at least one valid SRT cue');
      return;
    }

    let invalid = false;
    for (let index = 0; index < cues.length; index += 1) {
      const cue = cues[index];
      const previous = cues[index - 1];
      if (cue.start < 0 || cue.end <= cue.start || (previous && cue.start < previous.end)) {
        invalid = true;
        break;
      }
    }

    if (invalid) {
      fail('SRT cue times overlap or are not ascending', srtPath, 'Fix cue ordering and overlapping timestamps');
    } else if (cues.at(-1).end > audioDuration + SRT_END_TOLERANCE_SECONDS) {
      fail('SRT final cue exceeds audio duration', srtPath, 'Trim caption timing or update audio/manifest duration');
    } else {
      pass(`${rel(srtPath)} alignment OK`);
    }
  } catch (error) {
    fail(`Could not inspect SRT: ${error.message}`, srtPath, 'Save captions as UTF-8 SRT');
  }
}

async function checkLesson(baseDir) {
  console.log(`\nChecking ${rel(baseDir)}`);
  const manifestPath = path.join(baseDir, 'manifest.json');
  const manifest = await readJson(manifestPath);
  if (!manifest) return;

  checkManifestBasics(manifest, manifestPath);
  await checkPdf(baseDir, manifest);
  const wavInfo = await checkWav(baseDir, manifest);
  await checkMp3(baseDir, manifest, wavInfo);
  await checkSrt(baseDir, manifest, wavInfo);
}

async function main() {
  const lessonDirs = await findManifestDirs(lessonsRoot);

  if (!lessonDirs.length) {
    console.log('No lesson manifests found under lessons/. A/V smoke tests skipped.');
    return;
  }

  for (const lessonDir of lessonDirs) {
    await checkLesson(lessonDir);
  }

  if (failures.length) {
    console.error(`\n${failures.length} A/V smoke test failure(s).`);
    process.exitCode = 1;
  } else {
    console.log('\nAll lesson A/V smoke tests passed.');
  }
}

main().catch((error) => {
  console.error(`❌ A/V smoke test runner crashed: ${error.stack || error.message}`);
  process.exitCode = 1;
});
