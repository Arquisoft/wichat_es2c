Feature: Game Playing
  As a user
  I want to play the trivia game
  So that I can test my knowledge and have fun

  Scenario: User plays a complete game
    Given A registered user
    When I click on Play button
    And I select the Hard difficulty
    And I answer 5 questions by clicking on the first option each time
    Then The game over modal appears