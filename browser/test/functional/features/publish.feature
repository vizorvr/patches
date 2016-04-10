Feature: Publishing

  Background:
    Given I am signed in
    And I am in the editor

  Scenario: Publishing
    When I publish the graph
    Then the player is playing
