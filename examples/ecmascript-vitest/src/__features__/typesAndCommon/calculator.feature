@feature
Feature: Simple Calculator 2

    Scenario: Simple addition
        Given the number "2"
        And the number "1"
        When I add them
        Then the result should be "3"

        Scenario: Simple division
        Given the number "2"
        And the number "2"
        When I divide them
        Then the result should be "1"