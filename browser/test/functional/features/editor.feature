Feature: Editor feature

  Background:
    Given I open the editor

  Scenario: Going to Program mode
    Given I go to Program mode
    Then I should see a patch called "Scene 1"
