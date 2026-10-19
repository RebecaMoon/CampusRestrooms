# CampusRestrooms

## Project Overview

CampusRestrooms is a web application that provides students with an interactive map of all restrooms on campus and their current availability.

For school maintenance staff, it provides a convenient way to update restroom statuses when a restroom is being cleaned, undergoing maintenance, or is out of service. This helps students find available restrooms and allows school staff to keep restroom information up to date.

## Features

### Students

- View all restrooms on an interactive campus map.
- Check the current availability of each restroom.
- Find directions to a selected restroom.

### Maintenance Staff

- View all restrooms on the campus map.
- Update restroom statuses to indicate whether a restroom is available, being cleaned, or out of service.

### Administrator

- Access all maintenance staff features.
- Create maintenance staff accounts.
- Delete maintenance staff accounts.

## Technology Stack

### Frontend

- **React** — JavaScript library for building the user interface.
- **Vite** — Frontend development and build tool.
- **Leaflet** — Interactive maps and restroom locations.
- **Amazon S3** — Hosting for the frontend's static files.
- **Amazon CloudFront** — Content delivery for the frontend.

### Backend

- **Flask** — Python web framework for the API.
- **Docker** — Containerization of the backend application.
- **Amazon EC2** — Hosting environment for the backend.

### Database

- **Amazon RDS for PostgreSQL** — Managed relational database for storing restroom information, availability statuses, and staff account data.

## Architecture

CampusRestrooms follows a client-server architecture with three main components.

### Frontend

Built with React, Vite, and Leaflet, the frontend provides the interactive campus map and the interfaces used by maintenance staff and the administrator. The static frontend files are hosted on Amazon S3 and delivered through Amazon CloudFront.

### Backend

The backend is built with Flask and packaged using Docker. It runs on an Amazon EC2 instance and provides the API used to retrieve restroom information, update restroom statuses, and manage staff accounts.

### Database

Amazon RDS for PostgreSQL stores restroom locations and statuses, as well as the information required to manage staff accounts.

The frontend communicates with the backend API, which interacts with the database to retrieve and update information.

For a detailed architecture diagram and additional technical information, see [Architecture Documentation](docs/architecture.md).
