# Chama o Vizinho — Site Web

Site Next.js 14 connecté au Supabase du projet mobile.

## Stack
- **Framework**: Next.js 14 (App Router)
- **Backend**: Supabase (même projet que l'app mobile)
- **Styling**: Tailwind CSS
- **Auth**: Supabase Auth (comptes partagés avec l'app)
- **Hébergement recommandé**: Vercel

## Structure des pages

| Route | Type | Description |
|---|---|---|
| `/` | SSR + ISR | Landing page avec stats live |
| `/servicos` | Static | Liste toutes les catégories |
| `/servicos/[categoria]` | SSG + ISR | Page SEO par catégorie |
| `/prestadores/[regiao]` | SSG + ISR | Page SEO par région |
| `/prestadores/perfil/[id]` | ISR | Profil prestataire |
| `/dicas` | ISR | Blog Dica do Dia |
| `/dicas/[id]` | ISR | Article individuel |
| `/comunidade` | CSR | Questions communauté |
| `/comunidade/[id]` | CSR | Question + réponses |
| `/precos` | Static | Page tarifs |
| `/auth` | Static | Login / Register |
| `/dashboard` | SSR + Auth | Espace utilisateur |

## Déploiement sur Vercel

### 1. Créer un repo GitHub
1. Va sur https://github.com/new
2. Nomme le repo `chamaovizinho-web`
3. Initialise sans README
4. Exécute ces commandes dans le dossier du projet :
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TON_USERNAME/chamaovizinho-web.git
git push -u origin main
```

### 2. Déployer sur Vercel
1. Va sur https://vercel.com
2. "New Project" → importe ton repo GitHub
3. Configure les variables d'environnement :
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://dvtdjyxhiqucvzadluhv.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (ta clé anon)
   - `NEXT_PUBLIC_SITE_URL` = `https://chamaovizinho.pt`
4. Deploy

### 3. Configurer le domaine OVH → Vercel
Dans ton panel OVH, ajoute un enregistrement DNS :
- Type: `CNAME`
- Nom: `@` (ou `www`)
- Valeur: `cname.vercel-dns.com`

Dans Vercel → Project Settings → Domains, ajoute `chamaovizinho.pt`.

## Développement local

```bash
npm install
npm run dev
```

## Variables d'environnement (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://dvtdjyxhiqucvzadluhv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_SITE_URL=https://chamaovizinho.pt
```

## Pages à développer (next steps)
- `/dashboard/pedidos` — Gestion des demandes
- `/dashboard/novo-pedido` — Formulaire nouveau pedido
- `/dashboard/perfil` — Édition du profil
- `/dashboard/admin` — Panel admin (port de AdminScreen.js)
- Auth email confirmation + reset password
