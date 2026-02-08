# Szybki Start / Quick Start Guide

## 🚀 Komendy do Uruchomienia Aplikacji / Commands to Run the Application

### Podstawowe Komendy / Basic Commands

#### 1. Pierwsze uruchomienie / First time setup

```bash
# Sklonuj repozytorium / Clone the repository
git clone https://github.com/excuse223/Start.git
cd Start

# Uruchom aplikację / Start the application
docker-compose up -d --build
```

**Co się dzieje? / What happens?**
- Buduje obrazy Docker dla backendu, frontendu i bazy danych
- Tworzy i uruchamia wszystkie kontenery
- Automatycznie tworzy bazę danych

#### 2. Dostęp do aplikacji / Access the application

Po uruchomieniu otwórz w przeglądarce / After starting, open in browser:

- **Frontend (Aplikacja webowa)**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Dokumentacja API**: http://localhost:8000/docs
- **Baza danych PostgreSQL**: localhost:5432

---

### Zarządzanie Aplikacją / Application Management

#### Uruchomienie aplikacji / Start the application

```bash
# Standardowe uruchomienie / Standard start
docker-compose up -d

# Z przebudową kontenerów / With rebuild
docker-compose up -d --build

# Bez trybu w tle (wyświetla logi) / Without detached mode (shows logs)
docker-compose up
```

#### Zatrzymanie aplikacji / Stop the application

```bash
# Zatrzymaj kontenery / Stop containers
docker-compose stop

# Zatrzymaj i usuń kontenery / Stop and remove containers
docker-compose down

# Zatrzymaj i usuń wszystko (łącznie z danymi!) / Stop and remove everything (including data!)
docker-compose down -v
```

**⚠️ UWAGA:** Komenda `docker-compose down -v` usuwa WSZYSTKIE DANE z bazy!

#### Restart aplikacji / Restart the application

```bash
# Restart wszystkich serwisów / Restart all services
docker-compose restart

# Restart konkretnego serwisu / Restart specific service
docker-compose restart backend
docker-compose restart frontend
docker-compose restart postgres
```

---

### Sprawdzanie Statusu / Checking Status

```bash
# Pokaż uruchomione kontenery / Show running containers
docker-compose ps

# Pokaż logi wszystkich serwisów / Show logs from all services
docker-compose logs

# Pokaż logi konkretnego serwisu / Show logs from specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres

# Śledź logi w czasie rzeczywistym / Follow logs in real-time
docker-compose logs -f
docker-compose logs -f backend
```

---

### Migracje Bazy Danych / Database Migrations

```bash
# Zastosuj migracje / Apply migrations
docker-compose exec backend alembic upgrade head

# Utwórz nową migrację / Create new migration
docker-compose exec backend alembic revision --autogenerate -m "opis zmiany"

# Cofnij ostatnią migrację / Rollback last migration
docker-compose exec backend alembic downgrade -1

# Sprawdź status migracji / Check migration status
docker-compose exec backend alembic current
```

---

### Backup i Przywracanie Bazy / Database Backup & Restore

#### Backup

```bash
# Utwórz backup / Create backup
docker-compose exec postgres pg_dump -U admin work_hours_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Lub prościej / Or simpler
docker-compose exec postgres pg_dump -U admin work_hours_db > backup.sql
```

#### Restore

```bash
# Przywróć z backupu / Restore from backup
docker-compose exec -T postgres psql -U admin work_hours_db < backup.sql
```

---

### Tryb Deweloperski / Development Mode

#### Uruchomienie z hot-reload / Start with hot-reload

```bash
# Backend i frontend już mają hot-reload w trybie development
# Backend and frontend already have hot-reload in development mode
docker-compose up
```

#### Instalacja nowych dependencji / Install new dependencies

**Backend (Python):**
```bash
# Wejdź do kontenera / Enter container
docker-compose exec backend bash

# Zainstaluj pakiet / Install package
pip install nazwa-pakietu

# Dodaj do requirements.txt / Add to requirements.txt
pip freeze > requirements.txt

# Wyjdź / Exit
exit
```

**Frontend (Node.js):**
```bash
# Wejdź do kontenera / Enter container
docker-compose exec frontend sh

# Zainstaluj pakiet / Install package
npm install nazwa-pakietu

# Wyjdź / Exit
exit

# Przebuduj frontend / Rebuild frontend
docker-compose up -d --build frontend
```

---

### Czyszczenie / Cleanup

```bash
# Usuń zatrzymane kontenery / Remove stopped containers
docker-compose rm

# Wyczyść nieużywane obrazy Docker / Clean unused Docker images
docker system prune

# Wyczyść wszystko (obrazy, kontenery, wolumeny) / Clean everything
docker system prune -a --volumes
```

**⚠️ UWAGA:** To usunie WSZYSTKIE DANE!

---

### Rozwiązywanie Problemów / Troubleshooting

#### Problem: Port już używany / Port already in use

```bash
# Sprawdź co używa portu / Check what's using the port
sudo lsof -i :3000
sudo lsof -i :8000
sudo lsof -i :5432

# Lub / Or
netstat -tulpn | grep 3000
```

**Rozwiązanie / Solution:** Zatrzymaj aplikację używającą portu lub zmień port w `docker-compose.yml`

#### Problem: Baza danych nie odpowiada / Database not responding

```bash
# Sprawdź status bazy / Check database status
docker-compose exec postgres pg_isready -U admin

# Sprawdź logi bazy / Check database logs
docker-compose logs postgres

# Restart bazy / Restart database
docker-compose restart postgres
```

#### Problem: Frontend nie łączy się z backend / Frontend can't connect to backend

```bash
# Sprawdź czy backend działa / Check if backend is running
docker-compose ps

# Sprawdź logi backend / Check backend logs
docker-compose logs backend

# Sprawdź endpoint / Check endpoint
curl http://localhost:8000/health
```

#### Problem: Błąd podczas budowania / Build error

```bash
# Wyczyść cache i przebuduj / Clean cache and rebuild
docker-compose build --no-cache
docker-compose up -d
```

---

### Przydatne Komendy Docker / Useful Docker Commands

```bash
# Wejdź do kontenera z bash/sh / Enter container with bash/sh
docker-compose exec backend bash
docker-compose exec frontend sh
docker-compose exec postgres bash

# Uruchom komendę w kontenerze / Run command in container
docker-compose exec backend python -c "print('Hello')"

# Pokaż użycie zasobów / Show resource usage
docker stats

# Pokaż wszystkie kontenery / Show all containers
docker ps -a

# Pokaż wszystkie obrazy / Show all images
docker images
```

---

## 📝 Szybka Ściągawka / Quick Cheat Sheet

| Akcja | Komenda |
|-------|---------|
| Pierwsze uruchomienie | `docker-compose up -d --build` |
| Start | `docker-compose up -d` |
| Stop | `docker-compose stop` |
| Restart | `docker-compose restart` |
| Logi | `docker-compose logs -f` |
| Status | `docker-compose ps` |
| Usuń wszystko | `docker-compose down -v` |
| Migracje | `docker-compose exec backend alembic upgrade head` |
| Backup DB | `docker-compose exec postgres pg_dump -U admin work_hours_db > backup.sql` |
| Restore DB | `docker-compose exec -T postgres psql -U admin work_hours_db < backup.sql` |

---

## ⚡ Najczęściej Używane / Most Common

### Codzienne użycie / Daily use

```bash
# Rano - uruchom aplikację / Morning - start app
docker-compose up -d

# Wieczorem - zatrzymaj aplikację / Evening - stop app
docker-compose stop

# Sprawdź czy działa / Check if running
docker-compose ps

# Zobacz logi w razie problemu / View logs if problem
docker-compose logs -f backend
```

### Po zmianach w kodzie / After code changes

```bash
# Backend - automatyczny reload (nie trzeba restartować)
# Backend - automatic reload (no restart needed)

# Frontend - przebuduj jeśli zmieniono package.json
# Frontend - rebuild if package.json changed
docker-compose up -d --build frontend
```

---

## 🆘 Pomoc / Help

Jeśli masz problemy / If you have problems:

1. Sprawdź logi: `docker-compose logs`
2. Zobacz status: `docker-compose ps`
3. Sprawdź dokumentację: README.md
4. Zobacz szczegóły problemu w logach konkretnego serwisu

---

## 🔗 Linki / Links

- **Aplikacja / Application**: http://localhost:3000 (domyślnie po polsku / default in Polish)
- **API Docs**: http://localhost:8000/docs
- **GitHub**: https://github.com/excuse223/Start

---

**Status:** ✅ Gotowe do użycia / Ready to use
**Wersja / Version:** 1.1.0
