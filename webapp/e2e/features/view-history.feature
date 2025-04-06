Feature: Checking game history as a logged in user

  Scenario: The user already logged in
    Given A registered user
    When I click on the view history button on the nav
    Then My match history appears

