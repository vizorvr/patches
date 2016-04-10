Feature: Publishing

  Background:
    Given I am signed in
    And I am in the editor

  Scenario: Publishing
    When I publish the graph
    Then I expect the player to play
