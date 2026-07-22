# Contributing to Quantum AI Frontend

Thanks for contributing to the QuantumAI chat UI.

## Before you start

1. Follow the [Code of Conduct](CODE_OF_CONDUCT.md).
2. Report vulnerabilities via [SECURITY.md](SECURITY.md).

## Development setup

```bash
npm ci
cp .env.example .env   # optional; Vite proxies /api → localhost:5001
npm run dev            # http://localhost:5175
```

The [Quantum-AI-Backend](https://github.com/QuantumLogicsLabs/Quantum-AI-Backend) should be running on port **5001**.

## Checks before a PR

```bash
npm run build
```

Do not commit `.env`, tokens, or private user conversation data.

## License

By contributing, you agree that your contributions are licensed under the
[MIT License](../LICENSE).
