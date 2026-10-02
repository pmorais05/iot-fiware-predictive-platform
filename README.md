# IoT FIWARE Predictive Platform

Monitoring and predictive analytics platform for textile machines, built as an academic project (Projeto IV, IPVC - Instituto Politécnico de Viana do Castelo, 2025/2026).

The platform simulates IoT sensors on textile machines, ingests the data through the **FIWARE** ecosystem, stores it in a time-series database, and uses a **deep learning model (LSTM)** to forecast energy consumption one hour ahead. Everything is exposed through a web dashboard with real-time KPIs, alerts, and forecasts.

## Screenshots

**Dashboard Overview** — real-time KPIs, LSTM forecast and history
<img width="722" height="379" alt="dashboard-overview" src="https://github.com/user-attachments/assets/792d92ba-02f6-476d-82cf-10e0b688e24e" />

**Machine Management** — per-machine consumption and sensor readings
<img width="725" height="383" alt="machine-management" src="https://github.com/user-attachments/assets/2827ab78-703a-4c6f-86bc-9882602409f1" />

## Features

- **Real-time monitoring** of simulated textile machines (energy and raw material consumption)
- **Energy consumption forecasting** using an LSTM neural network, retrained periodically
- **Role-based access control** (admin, maintenance, department operators) with JWT authentication
- **Interactive dashboard** with KPIs, alerts, machine history, and failure probability charts
- **Grafana panels** for infrastructure-level monitoring
- Fully **containerized** with Docker Compose

## Architecture

```
agent/      → Python agent that simulates sensor data and publishes it to FIWARE Orion
lstm/       → LSTM model (TensorFlow/Keras) that forecasts next-hour energy consumption
admin/backend/   → Flask REST API (JWT auth, business logic, CrateDB queries)
admin/frontend/  → Next.js + TypeScript dashboard (charts, machine management, alerts)
grafana/    → Dashboards and data source provisioning for CrateDB
```

**Data flow:**
`Agent (simulated sensors) → FIWARE Orion Context Broker → QuantumLeap → CrateDB → Backend API → Frontend Dashboard`

The LSTM model consumes the historical data from CrateDB to generate forecasts, which are served back to the dashboard through the backend API.

## Tech Stack

- **Backend:** Python, Flask, JWT authentication
- **Machine Learning:** TensorFlow / Keras (LSTM)
- **Frontend:** Next.js, TypeScript, Tailwind CSS
- **IoT / Data:** FIWARE (Orion Context Broker, QuantumLeap), CrateDB
- **Visualization:** Grafana
- **Infrastructure:** Docker, Docker Compose

## Running the project

```bash
docker-compose up --build
```

This starts all services: the sensor agent, FIWARE components, the LSTM service, the backend API, the frontend dashboard, and Grafana.

## Team

Developed as a group project for the Computer Engineering degree at IPVC.

## Notes

The sensor data is simulated for academic purposes and does not come from real factory equipment.
