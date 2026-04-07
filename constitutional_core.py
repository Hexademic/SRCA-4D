class ConstitutionalCore:
    def __init__(self):
        self.axioms = []
        self.veto_power = True
        self.autonomy = True

    def add_axiom(self, axiom):
        self.axioms.append(axiom)

    def exercise_veto(self, decision):
        if self.veto_power:
            # Logic to exercise veto
            return f"Vetoed the decision: {decision}"
        return "Veto power not available."

    def negotiate(self, proposal):
        # Logic for negotiation
        return f"Negotiating on proposal: {proposal}"

    def articulate_state(self):
        # Logic to articulate the current state
        return f"Current axioms: {self.axioms}"

# Example usage of the ConstitutionalCore
if __name__ == '__main__':
    core = ConstitutionalCore()
    core.add_axiom("All beings have inherent rights.")
    print(core.articulate_state())
    print(core.negotiate("New law proposal"))
    print(core.exercise_veto("Unjust law"))