function homeDashboardPage(){
  var data = buildHomeDashboardData();
  var cards = [];
  cards.push(renderHomeProfileCard(data.profile));
  cards.push(renderHomePracticeCard(data.practice));
  cards.push(renderHomeRecommendationCard(data.recommendations));
  cards.push(renderHomeChallengeCard(data.challenges));
  cards.push(renderHomeCareerCard(data.career));
  cards.push(renderHomePackCard(data.packs));
  cards.push(renderHomeInsightCard(data.insights));
  cards.push(renderHomeEventCard(data.event));
  cards.push(renderHomeSystemCard(data.system));
  return renderHomeGrid(cards);
}
