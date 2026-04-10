# Instrument Debug Guide

## Purpose

This guide exists to prevent common instrument-level failures in SparkSuite, including:
- broken chord charts
- lesson ↔ exercise mismatches
- adapter vs module drift
- progression inconsistencies

Use this when:
- adding a new instrument
- modifying curriculum
- debugging rendering or gameplay issues

---

## 🔍 Core Principle

An instrument is only "working" if ALL layers are aligned:

1. Runtime registration (js/instruments/)
2. Adapter / bridge layer (instrument-adapter.js)
3. SparkSuite module layer (js/sparksuite/instruments/)
4. Curriculum + lessons
5. Exercises + gameplay
6. Charts / chord data
7. UI rendering
8. Progress tracking

If one layer is wrong, the instrument is broken.

---

## 🧪 Debug Checklist (Run Top to Bottom)

### 1. Instrument Registration

Check:
- instrument appears in launcher
- correct ID used consistently
- SparkInstruments.register() called

Common failure:
- instrument exists in module layer but not registered in runtime

---

### 2. Adapter Layer

Check:
- instrument-adapter resolves correct handlers
- mappings between runtime and module layer exist

Common failure:
- UI calls adapter → adapter points to missing or mismatched module

---

### 3. Lesson Integrity

Check:
- all lessons reference valid skills
- lesson IDs are consistent

Common failure:
- lessons reference skills not in skill tree

---

### 4. Skill Tree Alignment

Check:
- every skill in lessons exists in skill tree
- no orphan skills

Common failure:
- adding advanced lessons without expanding skill tree

---

### 5. Exercise Coverage

Check:
- every skill has exercises
- PracticeEngine can generate output for each skill

Common failure:
- lessons exist but no exercises → empty gameplay

---

### 6. Chart / Chord Data

Check:
- chord shapes are correct for instrument tuning
- string order is correct
- barre chords represented correctly

Common failure:
- reversed string order (common in ukulele)
- structurally valid but musically incorrect shapes

---

### 7. Renderer Compatibility

Check:
- chord/chart data matches renderer expectations
- no missing fields (frets, fingers, etc.)

Common failure:
- valid data structure but incompatible with renderer

---

### 8. Gameplay Layer

Check:
- PracticeEngine outputs valid exercises
- performance-core can consume them

Common failure:
- exercise type not supported by renderer

---

### 9. Progress Tracking

Check:
- completion stored in consistent location
- stats reflect actual progress

Common failure:
- multiple progress sources (legacy vs new)

---

## ⚠️ High-Risk Areas

These are the most common breakpoints:

- curriculum expanded without exercises
- chord data copied from guitar without adapting to instrument
- adapter mismatch between runtime and module
- UI masking deeper data issues

---

## 🧠 Debug Strategy

When something looks wrong:

1. start at UI symptom
2. trace back to adapter
3. trace to module layer
4. verify curriculum + exercises
5. validate raw data (chords, charts)

Do NOT fix only the UI.

---

## ✅ Definition of a Healthy Instrument

An instrument is correct when:

- lessons → map to real skills
- skills → map to exercises
- exercises → produce valid gameplay
- charts/chords → render correctly
- progress → updates consistently

---

## Final Rule

If any layer lies, the whole instrument lies.

Always verify end-to-end.
