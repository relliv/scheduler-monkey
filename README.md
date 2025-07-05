# Scheduler Monkey

Scheduler Monkey is a desktop application that helps you manage, schedule, and execute scripts with ease on your local machine with simple UI. Built with Electron, Vue 3, and TypeScript, it provides a clean and intuitive interface for organizing your automation scripts and running them on customizable schedules.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

## Features

🚀 **Script Management** - Organize scripts in vault directories for easy access and management  
⏰ **Cron-based Scheduling** - Schedule scripts to run at specific times using cron expressions  
📊 **Execution Logging** - Track script execution history with detailed logs including output and errors  
🔄 **Real-time Updates** - See execution results in real-time with automatic UI updates  
📝 **Script Editor** - Built-in Monaco editor for creating and editing scripts  
🌙 **Dark Mode Support** - Comfortable viewing experience in any lighting condition  
🔒 **Local Storage** - All data is stored locally using SQLite for privacy and performance

## Installation

```sh
# Clone the repository
git clone https://github.com/relliv/scheduler-monkey.git

# Enter the project directory
cd scheduler-monkey

# Install dependencies
pnpm install

# Start the development server
pnpm dev

# Build for production
pnpm build
```

## Usage

1. **Select a Vault Directory** - Choose a directory where your scripts are stored
2. **Create or Import Scripts** - Add new scripts or use existing ones in your vault
3. **Schedule Scripts** - Set up cron expressions to determine when scripts should run
4. **Monitor Execution** - View logs and results of script executions

## Supported Script Types

Scheduler Monkey supports various script types including:

- JavaScript/TypeScript (`.js`, `.ts`)
- Shell scripts (`.sh`)
- Python (`.py`)
- And more!

## Technology Stack

- **Frontend**: Vue 3, TypeScript, TailwindCSS
- **Backend**: Electron, Node.js
- **Database**: SQLite with Drizzle ORM
- **Scheduling**: node-cron
- **Editor**: Monaco Editor
- **State Management**: Pinia

## Project Structure

```markdown
scheduler-monkey/
├── electron/           # Electron main and preload scripts
├── src/
│   ├── components/     # Vue components
│   ├── database/       # Database schema and queries
│   ├── layouts/        # Layout components
│   ├── stores/         # Pinia stores
│   ├── shared/         # Shared types and utilities
│   └── App.vue         # Main application component
├── public/             # Static assets
└── index.html          # Entry HTML file
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
