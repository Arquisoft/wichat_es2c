Feature: Registering and logging in as a new user

  Scenario: The user is not registered in the site
    Given An unregistered user
    When I fill the data in the register form and press submit
    Then A confirmation message should be shown in the screen

  Scenario: The same user logs in after registration
    Given The user is on the login page
    When They fill the login form with the same credentials
    Then They should be redirected to the home page
