# Vault Server Architecture - Quick Reference

**TL;DR:** We recommend Python/FastAPI with a hybrid modular monolith architecture, deployed locally with the desktop app installer, with optional cloud sync in Phase 2.

---

## Decision Matrix

| Decision Point | Recommendation | Rationale |
|----------------|----------------|-----------|
| **Architecture** | Hybrid Modular Monolith | Start simple, scale as needed |
| **Language** | Python 3.11+ | Best PDF libraries, fast development |
| **Framework** | FastAPI | Async support, auto docs, type safety |
| **Database (Local)** | SQLite | Zero config, embedded |
| **Database (Cloud)** | PostgreSQL | Production-ready, scalable |
| **Storage (Local)** | File System | Simple, fast |
| **Storage (Cloud)** | S3-compatible | Scalable, standard |
| **Deployment** | Bundled with installer | Seamless UX |
| **Auth** | JWT + RBAC | Industry standard |
| **Caching** | Redis | Fast, reliable |
| **Background Tasks** | Celery | Mature, proven |

---

## Implementation Phases

### ✅ Phase 1: Local Server (v1.0) - 3-4 months
**Goal:** Replace IPC with REST API, bundle with installer

**Features:**
- REST API for all operations
- SQLite database
- File system storage
- Background PDF extraction
- Thumbnail generation
- Basic caching

**Deliverables:**
- FastAPI server executable
- Installer integration
- API documentation
- Desktop app HTTP client
- 70%+ test coverage

---

### ✅ Phase 2: Cloud Support (v1.5) - 2-3 months
**Goal:** Enable optional cloud deployment and sync

**Features:**
- Cloud deployment option
- PostgreSQL database
- S3 object storage
- Multi-user authentication
- Real-time updates (WebSocket)
- Cloud sync engine

**Deliverables:**
- Docker deployment
- Cloud deployment guide
- Sync conflict resolution
- 80%+ test coverage

---

### ✅ Phase 3: Enterprise (v2.0) - 3-4 months
**Goal:** Scale and add enterprise features

**Features:**
- Elasticsearch search
- Audit logging
- Admin dashboard
- Horizontal scaling
- High availability
- CDN integration

**Deliverables:**
- Production deployment
- Monitoring dashboards
- Performance benchmarks
- Security audit

---

## Technology Comparison

### Why Python/FastAPI?

| Criterion | Rating | Notes |
|-----------|--------|-------|
| Development Speed | ⭐⭐⭐⭐⭐ | Fastest to prototype |
| PDF Processing | ⭐⭐⭐⭐⭐ | Best libraries (PyPDF2, pikepdf) |
| Learning Curve | ⭐⭐⭐⭐⭐ | Easy to learn |
| Performance | ⭐⭐⭐ | 1k-5k req/s (sufficient) |
| Ecosystem | ⭐⭐⭐⭐⭐ | 400k+ packages |
| Type Safety | ⭐⭐⭐⭐ | Pydantic validation |

### Performance Numbers

| Metric | Python/FastAPI | Node.js | Go | Rust |
|--------|----------------|---------|-----|------|
| Requests/sec | 4,500 | 8,000 | 35,000 | 50,000 |
| Dev Time (weeks) | 9 | 10 | 15 | 20 |
| Memory (base) | 50MB | 40MB | 15MB | 10MB |
| PDF Support | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐ |

**Conclusion:** Python offers the best balance for v1.0

---

## API Quick Reference

### Base URL
```
http://localhost:8000/api/v1
```

### Authentication
```http
POST /auth/login
{
  "username": "user",
  "password": "pass"
}

Response:
{
  "access_token": "eyJ...",
  "token_type": "bearer"
}
```

### Core Operations

**Create Case:**
```http
POST /cases
Authorization: Bearer <token>
{
  "name": "Research Project 2024"
}
```

**Upload File:**
```http
POST /cases/{case_id}/files
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: [binary]
```

**Extract PDF:**
```http
POST /files/{file_id}/extract
Authorization: Bearer <token>
{
  "pages": "all"
}

Response:
{
  "job_id": "uuid",
  "status": "processing"
}
```

**Check Status:**
```http
GET /extractions/{job_id}/status

Response:
{
  "status": "processing",
  "progress": 45,
  "total_pages": 120
}
```

---

## Deployment Options

### Option 1: Bundled (Default) ⭐
```
Installer includes:
├── Desktop App (Electron)
└── Server (Python executable)
    ├── Auto-starts on boot
    └── Listens on localhost:8000
```

**Pros:** Zero config, works offline, privacy  
**Cons:** Updates tied to app updates

### Option 2: Cloud
```
Desktop App ←→ Cloud Server (vault.example.com)
```

**Pros:** Multi-device, collaboration, centralized  
**Cons:** Requires internet, hosting costs

### Option 3: Hybrid ⭐
```
Desktop App ←→ Local Server (primary)
           ↓
    Cloud Server (optional sync)
```

**Pros:** Best of both, flexible  
**Cons:** More complexity

---

## Security Checklist

### Local Deployment
- [ ] Bind to 127.0.0.1 only
- [ ] No authentication required
- [ ] OS-level security
- [ ] Encrypted file storage (optional)

### Cloud Deployment
- [ ] JWT authentication
- [ ] HTTPS/TLS required
- [ ] Role-based access control
- [ ] Rate limiting (5 req/min for login)
- [ ] File encryption at rest
- [ ] Audit logging
- [ ] Regular security updates

---

## File Structure

### Server Project
```
vault-server/
├── app/
│   ├── main.py           # FastAPI app
│   ├── api/              # API routes
│   │   ├── auth.py
│   │   ├── cases.py
│   │   ├── files.py
│   │   └── bookmarks.py
│   ├── core/             # Core utilities
│   │   ├── config.py
│   │   ├── security.py
│   │   └── dependencies.py
│   ├── models/           # Database models
│   ├── schemas/          # Pydantic schemas
│   ├── services/         # Business logic
│   └── storage/          # File storage
├── tests/
├── alembic/              # Migrations
├── requirements.txt
└── Dockerfile
```

### Desktop App Integration
```typescript
// services/ApiClient.ts
export class VaultApiClient {
  private baseUrl = 'http://localhost:8000/api/v1';
  
  async createCase(name: string): Promise<Case> {
    const response = await fetch(`${this.baseUrl}/cases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify({ name })
    });
    return response.json();
  }
}
```

---

## Database Schema (Simplified)

```sql
-- Core tables
users (id, username, email, password_hash, role)
cases (id, name, description, owner_id)
files (id, case_id, name, type, size, storage_path)
tags (id, name, color)
bookmarks (id, file_id, page, name, notes)

-- Relationships
case_tags (case_id, tag_id)
file_tags (file_id, tag_id)

-- Background jobs
extraction_jobs (id, file_id, status, progress)
```

---

## Cost Estimates (Monthly)

### Development Costs
- **Developer Time:** $50-150/hour
- **Phase 1 (3-4 months):** ~$30k-60k
- **Phase 2 (2-3 months):** ~$20k-40k
- **Phase 3 (3-4 months):** ~$30k-60k
- **Total:** ~$80k-160k

### Hosting Costs
- **Small (10-50 users):** $50/month
- **Medium (50-200 users):** $150/month
- **Large (200-1000 users):** $600/month

### Self-Hosted
- **Hardware:** $2k-10k (one-time)
- **Electricity:** $30/month
- **Internet:** $100/month

---

## Common Questions

### Q: Why not use Electron for the server?
**A:** Electron is designed for desktop apps, not servers. It's resource-heavy and not optimized for server workloads.

### Q: Why Python over TypeScript/Node.js?
**A:** Better PDF processing libraries, faster development, easier to hire for. Performance is sufficient for initial scale.

### Q: Can I use this on my phone?
**A:** Not in v1.0. The server API enables mobile apps in the future, but the initial focus is desktop.

### Q: Will data be stored in the cloud?
**A:** Only if you opt-in. Default is local-only with no cloud connection.

### Q: What about offline mode?
**A:** Local deployment works 100% offline. Cloud sync can work offline with delayed sync.

### Q: How do updates work?
**A:** Auto-update for desktop app (Electron). Server updates bundled with app updates in local mode, separate in cloud mode.

---

## Next Steps

1. ✅ **Read full research:** [NETWORKING_RESEARCH.md](./NETWORKING_RESEARCH.md)
2. ✅ **Join discussion:** [NETWORKING_DISCUSSION_STARTER.md](./NETWORKING_DISCUSSION_STARTER.md)
3. ⬜ **Provide feedback:** Share your use case and requirements
4. ⬜ **Review architecture:** Comment on proposed approach
5. ⬜ **Contribute ideas:** What features matter most to you?

---

## Resources

- **Full Technical Analysis:** [NETWORKING_RESEARCH.md](./NETWORKING_RESEARCH.md)
- **Discussion Guide:** [NETWORKING_DISCUSSION_STARTER.md](./NETWORKING_DISCUSSION_STARTER.md)
- **Documentation Index:** [README.md](./README.md)
- **FastAPI Docs:** https://fastapi.tiangolo.com/
- **Python Docs:** https://docs.python.org/3/

---

**Last Updated:** January 2026  
**Status:** Research & Planning  
**Version:** 1.0
