Feature: Editor feature

  Background:
    Given I am in the editor

  Scenario: Going to Program mode
    Given I go to Program mode
    Then I should see a patch called "Scene"
