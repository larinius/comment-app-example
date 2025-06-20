# Comments Application

## Tech Stack  
**Frontend:**  
- React + TypeScript  
- Apollo Client (GraphQL)  
- Tailwind CSS  
- Framer Motion (animations)  
- File uploads with previews  

**Backend:**  
- Node.js + Express  
- Apollo GraphQL Server  
- MongoDB  
- Redis (pub/sub & token blacklisting)  
- AWS S3 (file storage)  
- WebSocket subscriptions  

## Key Features:  
- Real-time comment system with nested replies  
- User authentication (login/register with avatars)  
- File attachments (images, documents) with previews  
- Real-time notifications with sound alerts  
- Rich text editor with HTML sanitization  
- Sorting and pagination for comments  
- Toast notifications system  
- Responsive UI with animations  

## Startup locally:  
```bash
docker-compose -f docker-compose.local.yml down && \  
docker-compose -f docker-compose.local.yml build && \  
docker-compose -f docker-compose.local.yml up  
```  

**Access:**  
👉 Frontend: http://localhost:5173/  
👉 GraphQL Playground: http://localhost:8888/playground  

**Environment Requirements:**  
- MongoDB running on localhost:27017  
- Redis running on localhost:6379  
- AWS S3 credentials configured in .env  

**Note:** Make sure to create a `.env` file based on `envConfig.ts` before starting the project.

![image](https://github.com/user-attachments/assets/b46aae14-2637-4860-ac8b-98762cabf818)
