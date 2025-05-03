Feature: Game Functionality
  As a user
  I want to interact with the trivia game
  So that I can play, check my history, and see rankings

  Scenario: User plays a complete game
    Given A registered user
    When I click on Play button
    And I select the Hard difficulty
    And I interact with the chatbot asking for hints
    And I answer 5 questions by clicking on the first option each time
    Then The game over modal appears

  Scenario: The user already logged in
    Given A registered user
    When I click on the view history button on the nav
    Then My match history appears

  Scenario: View global leaderboard rankings
    Given A registered user is logged in
    When I click on the leaderboard button in the navigation
    Then I should see the global leaderboard rankings

  Scenario: Search for a specific user's matches
    Given I am on the leaderboard page
    When I search for a specific username
    Then I should see that user's match history
