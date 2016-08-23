Feature: Publishing

  Background:
    Given I am signed in
    And I open the editor

  Scenario: Publishing
    When I publish the project
    Then the player is playing
