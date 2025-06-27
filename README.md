## TODO

    [x] - 3 boxy sluzby Co nabizim - webove aplikace na miru , Integrace API a databazi navrh architektury Backendu, Sprava Linux serveru,
    [x] - poutavejsi CTA tlacitka
    [x] - SEO doplnky kratky odstavec na klicova slova
    [ ] - Sekce Clanky
    [x] - Lepsi popisky a tagy u projektu - vyřešeno přes admin systém
    [ ] - Stahnout CV
    [ ] - Preklad do EN
    [x] - Typing effect do main profile card
    [x] - Admin sekce pro správu obsahu

## Admin systém

### Nastavení

1. Ujistěte se, že máte nastavenou proměnnou `MONGODB_URI` v `.env` souboru
2. Vytvořte prvního admin uživatele:
   ```bash
   pnpm create:admin [username] [password] [email]
   ```
   Příklad:
   ```bash
   pnpm create:admin admin mypassword admin@example.com
   ```

### Přístup

- Admin panel: `/admin`
- Po přihlášení: `/admin/dashboard`

### Funkce

- ✅ Přihlášení/odhlášení
- ✅ Reset hesla (pomocí uživatelského jména a emailu)
- ✅ Správa projektů (přidání, editace, mazání)
- ✅ Vyhledávání a filtrace projektů
- ✅ Paginace
- ✅ Zabezpečené rotas (middleware)
- ✅ Session management s JWT

### Reset hesla

Pokud zapomenete heslo, můžete:

1. **Přes web interface:** Klikněte na "Zapomenuté heslo?" na přihlašovací stránce

   - Zadejte své uživatelské jméno a email
   - Pokud se údaje shodují s databází, můžete nastavit nové heslo

2. **Přes příkazovou řádku (záložní metoda):**
   ```bash
   # Přejít do složky projektu a spustit:
   pnpm run dev
   # Pak přes MongoDB Compass nebo MongoDB shell změnit heslo přímo v databázi
   ```

### Environment proměnné

Přidejte do `.env`:

```

```
