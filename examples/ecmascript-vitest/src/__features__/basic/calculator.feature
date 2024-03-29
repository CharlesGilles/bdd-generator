@feature
Feature: Simple Calculator

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

    @ignore
    Scenario: Simple multiplication to ignore
        Given the number "5"
        And the number "2"
        When I multiple them
        Then the result should be "10"