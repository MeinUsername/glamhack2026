#!/usr/bin/env bash
# Configure the production site password without writing it to a local file.
set +x
set -euo pipefail

project='glamhack-hack-2026'
service='glamhack-app'
region='us-central1'

usage() {
  cat <<'HELP'
Aufruf: ./scripts/set-site-password.sh [Optionen]

Fragt das Seitenpasswort zweimal verdeckt ab, erstellt das Secret SITE_PASSWORD
oder fügt eine neue Version hinzu und gewährt dem Cloud-Run-Servicekonto Zugriff.
Das Passwort wird nicht lokal gespeichert. Anschließend ist ein Deploy nötig.

  --project ID     Google-Cloud-Projekt (Standard: glamhack-hack-2026)
  --service NAME   Cloud-Run-Dienst (Standard: glamhack-app)
  --region NAME    Cloud-Run-Region (Standard: us-central1)
  -h, --help       Diese Hilfe anzeigen

Voraussetzung: gcloud ist installiert und angemeldet (gcloud auth login).
Der Cloud-Run-Dienst muss bereits existieren. Benötigt werden Rechte zum Lesen
des Dienstes und zum Verwalten des Secrets einschließlich seiner IAM-Bindungen.
HELP
}

while (($#)); do
  case "$1" in
    --project|--service|--region)
      if (($# < 2)) || [[ -z "$2" || "$2" == -* ]]; then
        printf 'Fehlender Wert für %s\n' "$1" >&2
        exit 1
      fi
      case "$1" in
        --project) project=$2 ;;
        --service) service=$2 ;;
        --region) region=$2 ;;
      esac
      shift 2
      ;;
    -h|--help) usage; exit 0 ;;
    *) printf 'Unbekannte Option: %s\n' "$1" >&2; usage >&2; exit 1 ;;
  esac
done

if ! command -v gcloud >/dev/null 2>&1; then
  printf 'gcloud fehlt. Bitte zuerst die Google Cloud CLI installieren.\n' >&2
  exit 1
fi
if [[ ! -t 0 ]]; then
  printf 'Bitte in einem interaktiven Terminal starten; das Passwort wird verdeckt abgefragt.\n' >&2
  exit 1
fi

# Resolve the actual runtime identity rather than assuming the build service account.
service_account=$(gcloud run services describe "$service" \
  --project="$project" --region="$region" \
  --format='value(spec.template.spec.serviceAccountName)')
if [[ -z "$service_account" ]]; then
  printf 'Kein Laufzeit-Servicekonto für %s gefunden. Es wurde nichts geändert.\n' "$service" >&2
  exit 1
fi

# A failed lookup (permissions/network) must not be mistaken for a missing secret.
existing=$(gcloud secrets list --project="$project" \
  --filter='name:SITE_PASSWORD' --format='value(name)')
secret_exists=false
while IFS= read -r name; do
  if [[ "$name" == 'SITE_PASSWORD' || "$name" == */secrets/SITE_PASSWORD ]]; then
    secret_exists=true
  fi
done <<< "$existing"

printf 'Projekt: %s · Dienst: %s · Region: %s\n' "$project" "$service" "$region"
trap 'unset site_password site_password_confirmation' EXIT
trap 'printf "\nAbgebrochen.\n" >&2; exit 130' INT TERM
IFS= read -r -s -p 'Neues Seitenpasswort: ' site_password
printf '\n' >&2
IFS= read -r -s -p 'Passwort wiederholen: ' site_password_confirmation
printf '\n' >&2
if [[ -z "$site_password" ]]; then
  printf 'Das Passwort darf nicht leer sein. Es wurde nichts geändert.\n' >&2
  exit 1
fi
if [[ "$site_password" != "$site_password_confirmation" ]]; then
  printf 'Die Passwörter stimmen nicht überein. Es wurde nichts geändert.\n' >&2
  exit 1
fi
unset site_password_confirmation

if [[ "$secret_exists" == true ]]; then
  printf '%s' "$site_password" | gcloud secrets versions add SITE_PASSWORD \
    --project="$project" --data-file=- --quiet
else
  printf '%s' "$site_password" | gcloud secrets create SITE_PASSWORD \
    --project="$project" --replication-policy=automatic --data-file=- --quiet
fi
unset site_password

gcloud secrets add-iam-policy-binding SITE_PASSWORD --project="$project" \
  --member="serviceAccount:$service_account" --role=roles/secretmanager.secretAccessor \
  --condition=None --quiet >/dev/null

printf '\nSITE_PASSWORD ist im Secret Manager gesetzt; das Laufzeit-Servicekonto hat Zugriff.\n'
printf 'Jetzt die App neu deployen. cloudbuild.yaml bindet SITE_PASSWORD:latest ein.\n'
printf 'Nach dem Austausch aller Instanzen werden bisherige Freigaben ungültig.\n'
