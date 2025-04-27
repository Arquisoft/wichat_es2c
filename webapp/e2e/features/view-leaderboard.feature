Feature: View Leaderboard
  As a user
  I want to see the global leaderboard rankings
  So that I can compare my performance with other players

  Scenario: View global leaderboard rankings
    Given A registered user is logged in
    When I click on the leaderboard button in the navigation
    Then I should see the global leaderboard rankings

  Scenario: Search for a specific user's matches
    Given I am on the leaderboard page
    When I search for a specific username
    Then I should see that user's match history