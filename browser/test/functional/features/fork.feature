Feature: Forking feature

  Background:
    Given I am signed in
    And I open the editor
    And I publish the project
    And the player is playing

  Scenario: Forking many nodes
    When I click on the button "#edit"
    And I am in the editor
    And I go to Program mode
    And I select all nodes
    And I copypaste
    Then the project is forked
    And I see 16 nodes


