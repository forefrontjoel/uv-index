# UV Index Tracker

A Next.js application that displays the current UV index for your location using the professional Meteomatics weather API.

## Features

- Real-time UV index data based on your current location
- Visual representation of UV severity with color-coding
- Maximum UV forecast for the day
- 24-hour UV forecast chart with interactive details
- Responsive design that works on mobile and desktop

## Prerequisites

- Node.js 18.0 or higher
- npm or yarn
- Docker and Docker Compose (for containerized deployment)

## API Credentials

This application uses the [Meteomatics API](https://www.meteomatics.com) for professional weather data. You'll need to set up environment variables for the API credentials:

1. Create a `.env.local` file in the root directory
2. Add your Meteomatics credentials:
   ```
   NEXT_PUBLIC_METEOMATICS_USERNAME=your_username_here
   NEXT_PUBLIC_METEOMATICS_PASSWORD=your_password_here
   ```
3. For development, the `.env.local` file will be automatically used
4. For production, set these environment variables in your hosting environment

## Getting Started

### Local Development

1. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

2. Set up your `.env.local` file with your Meteomatics credentials as shown above

3. Run the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Docker Deployment

#### Using Docker Compose (Recommended)

1. Make sure you have the `.env.local` file with your credentials in the project root

2. Build and start the container:

   ```bash
   docker-compose up -d
   ```

3. Access the application at [http://localhost:3000](http://localhost:3000)

#### Using Docker Directly

1. Build the Docker image:

   ```bash
   docker build --build-arg NEXT_PUBLIC_METEOMATICS_USERNAME=your_username_here --build-arg NEXT_PUBLIC_METEOMATICS_PASSWORD=your_password_here -t uv-index-app .
   ```

2. Run the container:

   ```bash
   docker run -p 3000:3000 -e NEXT_PUBLIC_METEOMATICS_USERNAME=your_username_here -e NEXT_PUBLIC_METEOMATICS_PASSWORD=your_password_here uv-index-app
   ```

3. Access the application at [http://localhost:3000](http://localhost:3000)

## Deployment Options

The containerized application can be deployed to various platforms:

- AWS Elastic Container Service (ECS)
- Google Cloud Run
- Azure Container Instances
- Kubernetes clusters
- Any platform supporting Docker containers

## Project Structure

```
uv-index/
├── app/                     # Next.js app directory
│   ├── components/          # React components
│   │   └── MeteomaticsUVDisplay.tsx
│   ├── services/            # API services
│   │   └── meteomaticsService.ts
│   ├── layout.tsx           # Root layout component
│   └── page.tsx             # Main page component
├── public/                  # Static assets
├── Dockerfile               # Docker configuration
├── docker-compose.yml       # Docker Compose configuration
├── .env.local               # Local environment variables (not committed to git)
├── .env.example             # Example environment variables template
└── next.config.ts           # Next.js configuration
```

## License

This project is open source and available under the [MIT License](LICENSE).
