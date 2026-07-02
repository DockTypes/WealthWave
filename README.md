# WealthWave - Dashboard Financiar Personal

Proiect realizat pentru stagiul de practică (Anul 2).

## 1. Problema și Scopul
**Alegerea problemei:** Gestionarea ineficientă a finanțelor personale (venituri vs. cheltuieli) de către studenți și tineri profesioniști. Problema nu este nici prea simplă (necesită CRUD, calcule agregate și vizualizare), nici prea complexă (nu necesită backend complet într-o primă iterație).

**Scopul:** Crearea unui dashboard financiar complet ("Single Page Application") care permite introducerea tranzacțiilor, categorisirea lor, calculul balanței curente și vizualizarea grafică a obiceiurilor de consum.

---

## 2. Etapele de Elaborare a Softului (SDLC)

### A. Analiza (Formularea cerințelor)
S-au definit următoarele cerințe funcționale:
- Utilizatorul trebuie să poată adăuga tranzacții (venit/cheltuială, sumă, categorie, descriere).
- Utilizatorul trebuie să poată șterge tranzacții în caz de greșeală.
- Sistemul trebuie să calculeze automat balanța curentă, totalul veniturilor și cheltuielilor.
- Datele trebuie persistate local pentru a nu fi pierdute la reîncărcarea paginii.
- Interfața trebuie să ofere vizualizări grafice (Doughnut Chart, Bar Chart) pentru analiză.

### B. Proiectarea (Tehnologii și Arhitectură)
- **Limbaj:** Vanilla JavaScript (ES6+), HTML5, CSS3. Nu s-a folosit niciun framework UI greu pentru a demonstra stăpânirea conceptelor de bază (DOM manipulation, event delegation).
- **Arhitectură:** Aplicația folosește un sistem de clase (OOP) pentru separarea responsabilităților:
  1. `TransactionManager` - se ocupă strict de persistența datelor (`localStorage`) și operațiunile CRUD.
  2. `AnalyticsEngine` - procesează datele și randează graficele via **Chart.js**.
  3. `UIController` - gestionează actualizarea DOM-ului și ascultă evenimentele.
  4. `Router` - un sistem custom de rute "Single Page Application" (SPA) pentru navigarea fluidă între 4 ecrane distincte (Dashboard, Activitate, Tranzacții, Setări).
- **Design:** Tema vizuală aleasă este **Dark Aurora** (elemente de "glassmorphism", dark mode cu irizații neon/aurora), extrem de modernă.

### C. Implementarea (Dezvoltarea aplicației)
- Construcția structurii HTML semantice.
- Stilizarea CSS3 cu variabile (`:root`), flexbox/grid layout și animații CSS keyframe (`fadeUp`).
- Scrierea logicii JS în modul SPA. Toate state-urile de grafice și tabele se recalculează dinamic folosind un event intern (`transactionsUpdated`).

### D. Testarea (Unit Testing)
Pentru a asigura calitatea codului, s-a implementat testare automată pe unitate (**Unit Testing**) folosind framework-ul **Jest**:
- S-au testat funcțiile core din `TransactionManager` (adăugare corectă a sumelor, calcul ID-uri unice, ștergere).
- S-au testat metodele de agregare din `AnalyticsEngine` (calculul sumelor per categorie și totalul balanței).

### E. Desfășurarea (Deployment)
Proiectul folosește instrumentul de versionare **Git** cu un sistem riguros de branch-uri (pe parcursul dezvoltării au existat branch-uri separate pentru `ui`, `core-logic`, `tests` și `pages` care au fost ulterior integrate în `main`).
Aplicația web urmează a fi "desfășurată" live pe **GitHub Pages**.

---

## 3. Git Workflow Utilizat
- `git init` - inițializarea repository-ului
- `git checkout -b <nume>` - lucrul pe feature branches separate
- `git commit -m` - commiting regulat și granular
- `git merge` - unificarea funcționalităților testate în main

Aplicația demonstrează o aplicare practică, de la cap la coadă, a ciclului de viață al unui produs software, respectând complet instrucțiunile primite.
