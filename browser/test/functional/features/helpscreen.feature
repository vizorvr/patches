Feature: Editor Helpscreen/Startscreen feature
  The help screen has at least Examples and Help tabs
  The tab Examples loads a list of graphs (article.graph)
  The tab Help shows a list of links and they have svg icons

  Background:
    Given I open the editor
    When I click on the button "#btn-help"
    Then I expect that element "#helpContainer" becomes visible

  Scenario: Help screen has tabs
    Then I expect that element "#helpContainer>nav" is visible
    And I expect that element "a[href='#helpLinks']" is visible
    And I expect that element "a[href='#helpExamples']" is visible

  Scenario: Help screen Tabs switch sections and work

  	When I click on the element "a[href='#helpLinks']"
  	Then I expect that element "section#helpLinks" becomes visible
  	And I expect that element "a[href='http://blog.vizor.io']" is visible
  	And I expect that element "a[href='http://blog.vizor.io']>svg>use" is visible

  	When I click on the element "a[href='#helpExamples']"
  	Then I expect that element "section#helpExamples" becomes visible
  	And I expect that element "#helpExamples article.card" becomes visible
