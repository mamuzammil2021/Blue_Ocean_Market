# V13 Excavator lifecycle implementation

- One Excavator dashboard; lifecycle is handled inside the dashboard, not a second dashboard.
- Persistent machine/deal lifecycle stages with pause/resume.
- Multiple documents per machine and per lifecycle stage.
- Separate Excavator parts register, linked to a machine when applicable.
- Documents support multiple uploads without replacing prior files.
- Existing repair/logistics/payment entries remain separate and connected to the machine.
