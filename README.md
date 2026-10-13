# ⚡ PowerOS — Battery-Aware Process Scheduling Simulator

**PowerOS** is a web-based Operating System simulator that demonstrates how CPU scheduling algorithms affect process performance and simulated battery energy consumption.

The project combines traditional CPU scheduling techniques with a Battery-Aware Adaptive Scheduling (BAAS) approach to compare execution metrics, visualize process scheduling, and understand the relationship between CPU utilization and power consumption.

## ✨ Features

- **📊 Interactive Dashboard** — View battery status, energy consumption, CPU utilization, and scheduling performance metrics.
- **⚙️ Process Management** — Add, edit, and manage processes with configurable arrival times, burst times, priorities, and other scheduling parameters.
- **🖥️ CPU Scheduling Simulator** — Simulate processes using FCFS, Shortest Job First (SJF), Round Robin, and Priority Scheduling.
- **🔋 Battery & Power Monitoring** — Explore simulated battery capacity, energy usage, and power-related metrics.
- **🧠 Battery-Aware Adaptive Scheduling (BAAS)** — Compare an adaptive scheduling approach with conventional CPU scheduling algorithms.
- **📈 Algorithm Comparison** — Compare waiting time, turnaround time, response time, makespan, and CPU utilization.
- **📉 Gantt Chart Visualization** — Understand process execution order and scheduling timelines visually.
- **📝 Simulation History** — Review previous simulation results.
- **📄 Academic Report** — Generate a structured report of simulation results.
- **🧪 Automated Tests** — Validate scheduling logic and metric consistency.

## 🛠️ Tech Stack

- **Frontend:** React, TypeScript
- **Build Tool:** Vite
- **Styling:** CSS, Tailwind CSS
- **Testing:** Project scheduling and consistency tests

## 🧮 Scheduling Algorithms

| Algorithm | Description |
|---|---|
| FCFS | Executes processes in order of arrival. |
| SJF | Selects the process with the shortest CPU burst time. |
| Round Robin | Allocates CPU time using a configurable time quantum. |
| Priority Scheduling | Selects processes according to their priority. |
| BAAS | Explores battery-aware adaptive scheduling and compares its results with conventional algorithms. |

## 📊 Performance Metrics

PowerOS calculates and displays scheduling metrics such as:

- **Waiting Time:** Time a process spends waiting for CPU execution.
- **Turnaround Time:** Total time from process arrival to completion.
- **Response Time:** Time from process arrival until its first CPU execution.
- **Makespan:** Total elapsed time required to complete the workload.
- **CPU Utilization:** Percentage of elapsed time during which the CPU is busy.
- **Energy Consumption:** Estimated energy used during the simulation.
- **Battery Level:** Simulated remaining battery capacity.

> **Note:** Battery levels and energy consumption are simulated estimates. They do not represent real-time measurements of your laptop's physical battery.

## 🚀 Getting Started

### Prerequisites

Install the following before running the project:

- [Node.js](https://nodejs.org/) — preferably a current LTS version
- npm, which is included with Node.js
- [Git](https://git-scm.com/) (optional, for cloning the repository)

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/tanishiraj321/PowerOS.git
```

**2. Open the project directory**

```bash
cd PowerOS
```

**3. Install dependencies**

```bash
npm install
```

**4. Start the development server**

```bash
npm run dev
```

Open the local URL printed in your terminal, usually `http://localhost:5173/`.

## 🧪 Testing

Run the available test suite using the test script configured in `package.json`. For example, if the project uses Vitest:

```bash
npm test
```

To create a production build:

```bash
npm run build
```

## 🎯 Project Objectives

PowerOS aims to demonstrate:

- How different CPU scheduling algorithms influence process execution and performance.
- How scheduling decisions can be evaluated alongside simulated energy consumption.
- How an adaptive scheduling strategy can be compared with traditional algorithms.
- How operating system concepts can be presented through an interactive web interface.

## 🎓 Academic Context

This project is developed as an educational Operating Systems project to explore CPU scheduling, performance analysis, and battery-aware process management through simulation.

## 👩‍💻 Author

**Tanishi Raj**

GitHub: [@tanishiraj321](https://github.com/tanishiraj321)

## 📜 License

No license has been specified yet. Unless a license is added to this repository, reuse and redistribution are subject to applicable copyright law.
