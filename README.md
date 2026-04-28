# SpendWise-FastAPI-Next.js-Kubernetes-
SpendWise is a full‑stack personal finance dashboard built with **FastAPI**, **Next.js**, **PostgreSQL**, and deployed on **Kubernetes** with autoscaling, load balancing, and health probes. This project is designed to be production‑ready, cloud‑deployable, and easy to extend.
# SpendWise — Personal Finance Dashboard (FastAPI + Next.js + Kubernetes)

---

## 🚀 Features

### Frontend (Next.js)
- Modern UI with Tailwind CSS v4 theme
- Dashboard with spending summaries
- Category breakdowns
- Responsive layout
- Authentication-ready structure
- Earthy premium colour palette (green-beige palette)

### Backend (FastAPI)
- JWT authentication
- CRUD for expenses, categories, budgets
- User‑specific filtering
- `/api/health` endpoint for Kubernetes probes

### Infrastructure
- Dockerized frontend + backend
- Kubernetes Deployment + Service + Ingress
- **LoadBalancer** for external access
- **Horizontal Pod Autoscaler (HPA)**
- **Liveness + Readiness probes**
- Secrets for DB + JWT
- PostgreSQL database

---

## 🏗️ Architecture

```
Next.js (frontend)
        |
Ingress (NGINX)
        |
LoadBalancer Service
        |
FastAPI backend (autoscaled)
        |
PostgreSQL database
```

---

## 📂 Repository Structure

```
spendwise/
│
├── spendwise-frontend/
│   ├── app/
│   ├── components/
│   ├── public/
│   ├── Dockerfile
│   
│
├── spendwise-backend/
│   ├── app/ - contains main.py,models.py etc
│   ├── requirements.txt
│   ├── Dockerfile
    |__k8s/
    ├── money_deployment.yaml
    ├── postgres.yaml
    ├── backend-hpa.yaml
    ├── ingress.yaml
    └── Secret.yaml
```

---

## 🔧 Environment Variables

### Backend (`backend-secret`)
| Variable | Description |
|---------|-------------|
| DATABASE_HOST | Postgres host |
| DATABASE_NAME | Database name |
| DATABASE_USER | Username |
| DATABASE_PASSWORD | Password |
| DATABASE_PORT | Port (5432) |
| JWT_SECRET | Secret key |
| ALGORITHM | HS256 |

---

## 🐳 Docker

### Build images
```bash
docker build -t shravrocks/spendwise-backend:latest .
docker build -t shravrocks/spendwise-frontend:v24 .
```

### Push images
```bash
docker push shravrocks/spendwise-backend:latest
docker push shravrocks/spendwise-frontend:latest
```

---

## ☸️ Kubernetes Deployment

### Apply backend
```bash
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml
kubectl apply -f k8s/backend-hpa.yaml
```

### Apply ingress
```bash
kubectl apply -f k8s/ingress.yaml
```

---

## ❤️ Health & Readiness

FastAPI endpoint:

```python
@app.get("/api/health")
def health():
    return {"message": "SpendWise API is running"}
```

Kubernetes probes:

```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 8000

readinessProbe:
  httpGet:
    path: /api/health
    port: 8000
```

---

## 📈 Autoscaling

HPA scales between **2–6 pods** based on CPU:

```yaml
minReplicas: 2
maxReplicas: 6
metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 60
```

---

## 🌐 Load Balancer

Backend Service:

```yaml
type: LoadBalancer
port: 80
targetPort: 8000
```

---

## 🛣️ Ingress Routing

```yaml
- path: /api
  pathType: Prefix
  backend:
    service:
      name: spendwise-backend-service
      port:
        number: 80
```

---

## 🧭 Roadmap

- Add charts & analytics
- Add email notifications
- Add budget alerts
- Add export to CSV/PDF
- Add Prometheus + Grafana monitoring
- Add CI/CD pipeline (GitHub → Docker → Kubernetes)

---

## 📜 License

MIT License.

## 👩🏻‍💻Author
Shravani.
