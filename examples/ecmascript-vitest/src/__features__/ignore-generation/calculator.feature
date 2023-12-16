@ignore-generation
Feature: Simple Calculator To Skip

    Scenario: Simple addition
        Given the number "2"
        And the number "1"
        When I add them
        Then the result should be "3"

    Scenario: Simple multiplication
        Given the number "5"
        And the number "2"
        When I multiple them
        Then the result should be "10"