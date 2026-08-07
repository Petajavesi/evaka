# Petajavesi fork from Espoo eVaka

## Petäjävesi customizations

Petäjävesi-specific frontend customizations live in
`frontend/src/lib-customizations/petajavesi/` (logo, login page texts, feature flags).
The deploy workflow (`.github/workflows/pet-build_and_deploy.yml`) builds the frontend
with `EVAKA_CUSTOMIZATIONS=petajavesi`.

To run the local dev frontend with Petäjävesi customizations, set the environment
variable before starting: `EVAKA_CUSTOMIZATIONS=petajavesi`. Without it the local dev
build defaults to the `espoo` folder, which still contains the same overrides for
backwards compatibility until it is cleaned up.

## Työvuorosuunnittelu (shift planning)

The shift planning add-on is documented in `docs/specs/features/shift-planning/`
(requirements, design and implementation status). Backend code lives in
`service/src/main/kotlin/evaka/instance/petajavesi/shiftplanning/` and database
migrations are `V891`/`V892`.

## How to develop and deploy frontend changes

### Prerequisites

- Docker Desktop
- NodeJs & NPM
- Read `frontend/README.md` and `frontend/src/lib-customizations/README.md`

### Start services locally

1.  Clone this repo
1.  `cd compose`
1.  Start Docker Desktop
1.  `docker compose up --detach`  
    This will start database, s3-mock, valkey, sftp and dummy-idp services in the background
1.  `pm2 start`  
    This will start frontend, apigw and evaka-service in the background
1.  `pm2 logs`  
    This opens logs. Use ctrl+c to exit, when finished
1.  evaka-service will take few minutes to start
1.  Open http://localhost:9099/login and you should see eVaka home page

### Edit frontend

1.  Open `frontend/src/citizen-frontend/login/LoginPage.tsx`
1.  Append text, e.g. "Foo" to line 64:  
    from: `<H1 noMargin>{i18n.loginPage.title}</H1>`  
    to: `<H1 noMargin>Foo {i18n.loginPage.title}</H1>`  
    and save changes. Your browser should refresh automatically to reflect the changes.
1.  Revert and save the change

### Edit localizations

Default localizations are under `frontend/src/lib-customizations/defaults` and overridden values are under `frontend/src/lib-customizations/espoo`.

For example the default titles for citizen login page are:  
-  `frontend/src/lib-customizations/defaults/citizen/i18n/fi.tsx` lines 199-200:  
   ```yaml
     loginPage: {
       title: 'Espoon kaupungin varhaiskasvatus',
   ```
-  `frontend/src/lib-customizations/defaults/citizen/i18n/sv.tsx` lines 199-200:  
   ```yaml
     loginPage: {
       title: 'Esbo stads småbarnspedagogik',
   ```
- `frontend/src/lib-customizations/defaults/citizen/i18n/en.tsx` lines 201-202:  
   ```yaml
     loginPage: {
       title: 'City of Espoo early childhood education',
   ```
and we have overridden the finnish variation in:
-  `frontend/src/lib-customizations/espoo/citizen.tsx` lines 49-50:
   ```yaml
         loginPage: {
           title: 'Petäjäveden kunnan varhaiskasvatus',
   ```

Edit `title` in `frontend/src/lib-customizations/espoo/citizen.tsx` line 50, save and see the change in browser. Revert the change.

### Stop local services

1.  `cd compose`
1.  `pm2 stop all`  
    This will stop frontend, apigw and evaka-service
1.  `docker compose down`  
    This will stop database, s3-mock, valkey, sftp and dummy-idp services

### Deploy changes to development environment

When you are happy with the changes, verify that you are in dev branch, commit and push the changes into the repo:  
```
git checkout dev
git fetch --all
git add frontend/src/lib-customizations/espoo/citizen.tsx
git commit -m "feat(ui): updated citizen login page translations"
git push
```
Follow the changes in GitHub repo's Actions page. When build and deploy has finished, the development environment should have the changes.

### Deploy changes to test environment

To deploy changes from dev to test environment, update repo's test branch:
```
git fetch --all
git checkout test
git rebase dev
git push
```
Follow the changes in GitHub repo's Actions page. When build and deploy has finished, the development environment should have the changes.

### Deploy changes to production environment

To deploy changes from dev to production environment, update repo's prod branch:
```
git fetch --all
git checkout prod
git rebase dev
git push
```
Follow the changes in GitHub repo's Actions page. When build and deploy has finished, the production environment should have the changes.