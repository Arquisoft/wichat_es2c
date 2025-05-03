# Load Testing Project with Artillery

This project contains configurations for performing load tests using Artillery.

## Requirements

- Node.js 22.13 or greater installed on your system.

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

## Usage

1. Run the `adduser` endpoint test:
   ```bash
   npm run test:adduser
   ```

2. Run the `addmatch` endpoint test:
   ```bash
   npm run test:addmatch
   ```

## Configuration

The target URL for the tests is configured directly within each test file (`.yml`) under the `config.target` key.

Example (`adduser-test.yml`):
```yaml
config:
  target: 'http://localhost:8000' # Gateway service URL
  # ... other configurations
```

Modify the `target` value in the respective `.yml` file to point to your desired endpoint.

## References

- [Official Artillery Documentation](https://www.artillery.io/docs)