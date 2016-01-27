# features/my_feature.feature

Feature: Example feature
  As a user of Cucumber.js
  I want to have documentation on Cucumber
  So that I can concentrate on building awesome applications

  Background:
    Given I am in the editor

  Scenario: Going to Program mode
    Given I go to Program mode
    Then I should see a patch called "Scene"
