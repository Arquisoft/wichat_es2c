Feature: Game Playing
  As a user
  I want to play the trivia game
  So that I can test my knowledge and have fun

  Scenario: User plays a complete game
    Given A registered user
    When I click on Play button
    Then The difficulty selection modal appears
    And I select the Normal difficulty
    And I answer 5 questions by clicking on the first option each time
    And I simulate the timer running out
    Then The game over modal appears or I verify game state