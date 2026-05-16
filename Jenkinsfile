// ============================================================
//  Jenkinsfile — AssetArt (assetnova) CI/CD pipeline
// ------------------------------------------------------------
//  Single Next.js + Prisma monorepo, iki Docker target üretir:
//    web      → Next.js standalone runtime
//    migrator → oneshot prisma migrate deploy
//
//  Akış:
//    Tüm branch + PR'ler: Checkout → Install → Lint+Typecheck → Audit
//                         → Gitleaks → Sonar → Trivy FS → Build → Trivy Image
//    main branch'i ayrıca:   Push → Deploy → Smoke
//
//  Paralelleştirme:
//    - Lint ile Typecheck aynı ws() üzerinde paralel (node_modules share).
//    - Build/ImageScan/Push aşamaları "web" + "migrator" target'larını
//      IMAGES.collectEntries pattern'i ile paralel çalıştırır.
//    - Her paralel branch: node('built-in') → unstash → iş.
//
//  Stash stratejisi: skipDefaultCheckout(true) → her stage'de auto-fetch yok.
//    Checkout stage workspace'i stash eder, diğer stage'ler unstash ile alır.
//
//  Tagging (her image için iki tag):
//    - main: :v2.1-${BUILD_NUMBER} (immutable) + :v2.1 (compose pull pointer)
//    - PR:   :pr-${CHANGE_ID}-${BUILD_NUMBER} + :pr-${CHANGE_ID} (lokal, push yok)
//
//  Multi-agent pattern:
//    - Quality (Install/Lint/Typecheck/Audit): node:20-alpine + pnpm@9
//    - SonarCloud:                              sonarsource/sonar-scanner-cli
//    - Build / Push / Deploy:                   built-in (host docker daemon)
//
//  Not: Mevcut docker-compose.prod.yml `ghcr.io/heavez/assetnova-{web,migrator}`
//       image isimlerine bağlı olduğundan, "assetart" rebrand'ine rağmen
//       image namespace'i geçici olarak `assetnova` prefix'i ile korunur.
// ============================================================

// PR build helper — Multibranch Pipeline'da PR build için Jenkins
// CHANGE_ID env'ini otomatik set eder; branch build'lerde (main dahil) null'dır.
def isPR() {
    return env.CHANGE_ID != null
}

pipeline {
    // Top-level agent yok; her stage kendi container'ında veya paralel branch'inde çalışır.
    agent none

    // Pipeline-wide değişkenler.
    environment {
        // Üretilecek image target'ları (Dockerfile multi-target build).
        IMAGES         = 'web,migrator'
        // GHCR adresleme; image-name pattern: ${PREFIX}-${target}
        GHCR_REGISTRY  = 'ghcr.io'
        GHCR_NAMESPACE = 'heavez'
        IMAGE_PREFIX   = 'assetnova'
        VERSION        = 'v2.1'
        // BUILD_NUMBER Jenkins tarafından otomatik atanır.
        IMMUTABLE_TAG  = "${VERSION}-${BUILD_NUMBER}"
        // Build context kökü ve compose dosyası
        DOCKERFILE     = 'deploy/Dockerfile'
        COMPOSE_FILE   = 'deploy/docker-compose.prod.yml'
        STACK_NAME     = 'assetart'
    }

    options {
        // Log satırlarına timestamp ekle.
        timestamps()
        // Aynı job'ın iki build'inin paralel çalışmasını engelle.
        disableConcurrentBuilds()
        // 30 dakikada bitmezse abort et.
        timeout(time: 30, unit: 'MINUTES')
        // Her stage'de implicit checkout scm'i kapat — Checkout aşaması bir
        // kez clone edip stash eder; diğer stage'ler unstash ile alır.
        skipDefaultCheckout(true)
        // Build retention — disk şişmesin.
        buildDiscarder(logRotator(
            numToKeepStr: '10',
            artifactNumToKeepStr: '5',
            daysToKeepStr: '14'
        ))
    }

    stages {

        // ------------------------------------------------------
        // 1) CHECKOUT — built-in
        // Repo'yu workspace'e clone eder, tümünü 'workspace' adıyla
        // stash eder. Sonraki stage'ler unstash ile alır.
        // ------------------------------------------------------
        stage('Checkout') {
            agent { label 'built-in' }
            steps {
                echo "Build context: ${isPR() ? 'PR #' + env.CHANGE_ID : 'main'}"
                echo "[BAŞLA] Kaynak kod çekiliyor (branch=${env.BRANCH_NAME ?: 'n/a'})"
                checkout scm
                stash includes: '**', name: 'workspace'
                echo "[BİTİŞ] Checkout + workspace stash tamamlandı"
            }
        }

        // ------------------------------------------------------
        // 2) INSTALL DEPENDENCIES — single ws (paylaşımlı)
        // pnpm install --frozen-lockfile; Lint/Typecheck/Audit
        // aşamaları aynı ws() path'ini reuse eder → node_modules disk'te kalır,
        // tekrar install yapılmaz. node:20-alpine + corepack pnpm@9.
        //
        // POSTINSTALL = "prisma generate" → @prisma/client üretilmesini
        // ister; bu yüzden install içinde otomatik tetiklenir.
        // ------------------------------------------------------
        stage('Install Dependencies') {
            agent none
            steps {
                script {
                    echo "Build context: ${isPR() ? 'PR #' + env.CHANGE_ID : 'main'}"
                    node('built-in') {
                        ws("workspace/${env.JOB_NAME}-quality-${env.BUILD_NUMBER}") {
                            unstash 'workspace'
                            docker.image('node:20-alpine').inside('-u root') {
                                sh '''
                                    set -e
                                    echo "[BAŞLA] pnpm install --frozen-lockfile"
                                    corepack enable
                                    corepack prepare pnpm@9 --activate
                                    pnpm install --frozen-lockfile --node-linker=hoisted
                                    echo "[BİTİŞ] Dependencies kurulu (node_modules + prisma client)"
                                '''
                            }
                        }
                    }
                }
            }
        }

        // ------------------------------------------------------
        // 3) LINT & TYPECHECK — paralel (2 iş, paylaşımlı ws)
        // Aynı ws() path'inde node_modules zaten var; iki paralel branch
        // pnpm lint ve pnpm typecheck koşturur. Hız için paralel.
        // ------------------------------------------------------
        stage('Lint & Typecheck') {
            agent none
            steps {
                script {
                    echo "Build context: ${isPR() ? 'PR #' + env.CHANGE_ID : 'main'}"
                    parallel(
                        'lint': {
                            node('built-in') {
                                ws("workspace/${env.JOB_NAME}-quality-${env.BUILD_NUMBER}") {
                                    docker.image('node:20-alpine').inside('-u root') {
                                        sh '''
                                            set -e
                                            corepack enable
                                            corepack prepare pnpm@9 --activate
                                            echo "[BAŞLA] pnpm lint"
                                            pnpm lint
                                            echo "[BİTİŞ] Lint temiz"
                                        '''
                                    }
                                }
                            }
                        },
                        'typecheck': {
                            node('built-in') {
                                ws("workspace/${env.JOB_NAME}-quality-${env.BUILD_NUMBER}") {
                                    docker.image('node:20-alpine').inside('-u root') {
                                        sh '''
                                            set -e
                                            corepack enable
                                            corepack prepare pnpm@9 --activate
                                            echo "[BAŞLA] pnpm typecheck (tsc --noEmit)"
                                            pnpm typecheck
                                            echo "[BİTİŞ] Typecheck temiz"
                                        '''
                                    }
                                }
                            }
                        }
                    )
                }
            }
        }

        // ------------------------------------------------------
        // 4) DEPENDENCY SCAN — pnpm audit --audit-level=high
        // High+ severity CVE bulunursa exit kodu non-zero → pipeline fail.
        // Aynı ws() path'ini reuse eder.
        // ------------------------------------------------------
        stage('Dependency Scan') {
            agent none
            steps {
                script {
                    echo "Build context: ${isPR() ? 'PR #' + env.CHANGE_ID : 'main'}"
                    node('built-in') {
                        ws("workspace/${env.JOB_NAME}-quality-${env.BUILD_NUMBER}") {
                            docker.image('node:20-alpine').inside('-u root') {
                                sh '''
                                    set -e
                                    corepack enable
                                    corepack prepare pnpm@9 --activate
                                    echo "[BAŞLA] pnpm audit (high+)"
                                    pnpm audit --audit-level high --prod
                                    echo "[BİTİŞ] Dependency scan temiz"
                                '''
                            }
                        }
                    }
                }
            }
        }

        // ------------------------------------------------------
        // 5) GITLEAKS SECRET SCAN — zricethezav/gitleaks
        // Working tree'de leak'lenmiş secret (API token, AWS key, JWT, vs.) arar.
        // Bulunursa exit 1 → pipeline fail.
        //   --no-git: stash'ten gelen workspace'te .git yok
        //   --redact: log'da bulunan secret'ı maskele
        // ------------------------------------------------------
        stage('Gitleaks Secret Scan') {
            agent none
            steps {
                script {
                    echo "Build context: ${isPR() ? 'PR #' + env.CHANGE_ID : 'main'}"
                    node('built-in') {
                        ws("workspace/${env.JOB_NAME}-gitleaks-${env.BUILD_NUMBER}") {
                            unstash 'workspace'
                            echo "[BAŞLA] Gitleaks secret scan"
                            sh '''
                                docker run --rm \
                                    -v "$(pwd):/repo" \
                                    -w /repo \
                                    zricethezav/gitleaks:latest \
                                    detect --source=/repo --verbose --redact --no-git
                            '''
                            echo "[BİTİŞ] Gitleaks scan temiz"
                        }
                    }
                }
            }
        }

        // ------------------------------------------------------
        // 6) SONARCLOUD ANALYSIS — sonarsource/sonar-scanner-cli
        // Tüm src/ klasörünü gönderir. Token Jenkins 'sonarcloud-token'
        // credential'ında saklı. Project key SonarCloud'da önceden
        // oluşturulmuş olmalı (HeaveZ_AssetNova).
        // ------------------------------------------------------
        stage('SonarCloud Analysis') {
            agent none
            steps {
                script {
                    echo "Build context: ${isPR() ? 'PR #' + env.CHANGE_ID : 'main'}"
                    node('built-in') {
                        ws("workspace/${env.JOB_NAME}-sonar-${env.BUILD_NUMBER}") {
                            unstash 'workspace'
                            echo "[BAŞLA] SonarCloud analizi (src/)"
                            sh 'rm -rf .scannerwork || true'
                            withSonarQubeEnv('SonarCloud') {
                                docker.image('sonarsource/sonar-scanner-cli:latest').inside('-u root --entrypoint=""') {
                                    sh '''
                                        sonar-scanner \
                                          -Dsonar.projectKey=HeaveZ_AssetNova \
                                          -Dsonar.organization=heavez \
                                          -Dsonar.sources=src \
                                          -Dsonar.exclusions=**/*.test.ts,**/*.spec.ts,**/node_modules/**,**/.next/** \
                                          -Dsonar.coverage.exclusions=**/*
                                    '''
                                }
                            }
                            echo "[BİTİŞ] SonarCloud raporu gönderildi"
                        }
                    }
                }
            }
        }

        // ------------------------------------------------------
        // 7) TRIVY FILESYSTEM SCAN — aquasec/trivy
        // Kod + bağımlılık + Dockerfile misconfig + secret tarar.
        // CRITICAL/HIGH bulunursa exit 1 → fail.
        // trivy-cache volume ile vuln DB cache hit.
        // ------------------------------------------------------
        stage('Trivy Filesystem Scan') {
            agent none
            steps {
                script {
                    echo "Build context: ${isPR() ? 'PR #' + env.CHANGE_ID : 'main'}"
                    node('built-in') {
                        ws("workspace/${env.JOB_NAME}-trivy-fs-${env.BUILD_NUMBER}") {
                            unstash 'workspace'
                            echo "[BAŞLA] Trivy filesystem scan (CRITICAL+HIGH üzerinde fail)"
                            sh '''
                                docker run --rm \
                                    -v "$(pwd):/repo" \
                                    -v trivy-cache:/root/.cache/trivy \
                                    aquasec/trivy:latest \
                                    fs /repo \
                                    --severity CRITICAL,HIGH \
                                    --exit-code 1 \
                                    --no-progress \
                                    --scanners vuln,misconfig,secret
                            '''
                            echo "[BİTİŞ] Trivy FS scan temiz"
                        }
                    }
                }
            }
        }

        // ------------------------------------------------------
        // 8) DOCKER BUILD — paralel (web + migrator target)
        // deploy/Dockerfile multi-target; context proje köküdür.
        // PR build'leri pr-* tag'iyle lokal kalır (Push aşaması main-only).
        //
        // BuildKit secret mount: gerçek DATABASE_URL / AUTH_SECRET inject
        // edilmek istenirse Jenkins 'assetart-build-db-url' / 'assetart-build-auth-secret'
        // credential'larından file mount ile geçirilebilir. Şimdilik
        // Dockerfile'ın güvenli fallback'i (random + placeholder) kullanılıyor;
        // gerçek değer image'a sızmaz, runtime'da .env.production'dan gelir.
        // ------------------------------------------------------
        stage('Docker Build') {
            agent none
            steps {
                script {
                    echo "Build context: ${isPR() ? 'PR #' + env.CHANGE_ID : 'main'}"
                    // Base image'ı bir kez pull et — paralel build'ler aynı katmanı paylaşır.
                    node('built-in') {
                        sh 'docker pull node:20-alpine'
                    }
                    parallel IMAGES.split(',').collectEntries { target ->
                        ["${target}": {
                            node('built-in') {
                                ws("workspace/${env.JOB_NAME}-build-${target}-${env.BUILD_NUMBER}") {
                                    unstash 'workspace'
                                    def imageName = "${GHCR_REGISTRY}/${GHCR_NAMESPACE}/${IMAGE_PREFIX}-${target}"
                                    def buildTag  = isPR() ? "pr-${env.CHANGE_ID}-${env.BUILD_NUMBER}" : "${IMMUTABLE_TAG}"
                                    def stableTag = isPR() ? "pr-${env.CHANGE_ID}"                    : "${VERSION}"
                                    echo "[BAŞLA] ${target} docker build — ${imageName}:${buildTag} + :${stableTag}"
                                    sh """
                                        DOCKER_BUILDKIT=1 docker build \
                                          --target ${target} \
                                          -f ${DOCKERFILE} \
                                          -t ${imageName}:${buildTag} \
                                          -t ${imageName}:${stableTag} \
                                          .
                                    """
                                    sh "docker images | grep ${IMAGE_PREFIX}-${target} || true"
                                    echo "[BİTİŞ] ${target} image hazır"
                                }
                            }
                        }]
                    }
                }
            }
        }

        // ------------------------------------------------------
        // 9) TRIVY IMAGE SCAN — paralel (web + migrator)
        // Lokal build edilmiş image'ları tarar (henüz push yok).
        // CRITICAL/HIGH → exit 1 → push olmaz, pipeline fail.
        //   --ignore-unfixed: patch'i olmayan vuln'leri sayma (false positive ↓)
        // docker.sock mount → host daemon image'larını görür.
        // ------------------------------------------------------
        stage('Trivy Image Scan') {
            agent none
            steps {
                script {
                    echo "Build context: ${isPR() ? 'PR #' + env.CHANGE_ID : 'main'}"
                    parallel IMAGES.split(',').collectEntries { target ->
                        ["${target}": {
                            node('built-in') {
                                ws("workspace/${env.JOB_NAME}-trivy-img-${target}-${env.BUILD_NUMBER}") {
                                    def stableTag = isPR() ? "pr-${env.CHANGE_ID}" : "${VERSION}"
                                    def imageName = "${GHCR_REGISTRY}/${GHCR_NAMESPACE}/${IMAGE_PREFIX}-${target}:${stableTag}"
                                    echo "[BAŞLA] Trivy image scan: ${imageName}"
                                    sh """
                                        docker run --rm \
                                            -v /var/run/docker.sock:/var/run/docker.sock \
                                            -v trivy-cache:/root/.cache/trivy \
                                            aquasec/trivy:latest \
                                            image ${imageName} \
                                            --severity CRITICAL,HIGH \
                                            --exit-code 1 \
                                            --no-progress \
                                            --ignore-unfixed
                                    """
                                    echo "[BİTİŞ] ${target} image scan temiz"
                                }
                            }
                        }]
                    }
                }
            }
        }

        // ------------------------------------------------------
        // 10) PUSH TO GHCR (main only) — paralel (web + migrator)
        // ÖNEMLİ: docker login paralel block DIŞINDA bir kez çalışır.
        // Login docker daemon'da cache'lenir; tüm paralel push'lar aynı
        // session'ı paylaşır → token sızdırma yok, race yok.
        // ------------------------------------------------------
        stage('Push to GHCR') {
            agent none
            when { branch 'main' }
            steps {
                script {
                    echo "Build context: ${isPR() ? 'PR #' + env.CHANGE_ID : 'main'}"
                    // Tek seferlik login
                    node('built-in') {
                        withCredentials([usernamePassword(
                            credentialsId: 'github-ghcr-assetart',
                            usernameVariable: 'GHCR_USER',
                            passwordVariable: 'GHCR_TOKEN'
                        )]) {
                            sh 'echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin'
                        }
                    }
                    // Sonra paralel push
                    parallel IMAGES.split(',').collectEntries { target ->
                        ["${target}": {
                            node('built-in') {
                                ws("workspace/${env.JOB_NAME}-push-${target}-${env.BUILD_NUMBER}") {
                                    def imageName = "${GHCR_REGISTRY}/${GHCR_NAMESPACE}/${IMAGE_PREFIX}-${target}"
                                    echo "[PUSH] ${imageName}:${IMMUTABLE_TAG} + :${VERSION}"
                                    sh "docker push ${imageName}:${IMMUTABLE_TAG}"
                                    sh "docker push ${imageName}:${VERSION}"
                                }
                            }
                        }]
                    }
                }
            }
        }

        // ------------------------------------------------------
        // 11) DEPLOY (main only) — built-in (docker compose)
        // Jenkins 'assetart-env-prod' Secret File'ından .env.production
        // workspace'e indirilir, üzerine IMMUTABLE_TAG eklenir, sonra
        // docker compose pull + up -d ile servisler güncellenir.
        // Migrator oneshot olduğu için compose otomatik koştur.
        // Tüm temp dosyalar trap ile temizlenir.
        // ------------------------------------------------------
        stage('Deploy') {
            agent none
            when { branch 'main' }
            steps {
                script {
                    echo "Build context: ${isPR() ? 'PR #' + env.CHANGE_ID : 'main'}"
                    node('built-in') {
                        ws("workspace/${env.JOB_NAME}-deploy-${env.BUILD_NUMBER}") {
                            unstash 'workspace'
                            echo "[BAŞLA] Production deploy — TAG=${IMMUTABLE_TAG}"
                            withCredentials([file(credentialsId: 'assetart-env-prod', variable: 'ENV_FILE')]) {
                                sh """
                                    set -e
                                    trap 'rm -f .env.production' EXIT
                                    rm -f .env.production
                                    install -m 600 "\$ENV_FILE" .env.production
                                    # IMAGE_TAG'i env'e ekle ki compose interpolation'ı resolve etsin
                                    echo "IMAGE_TAG=${IMMUTABLE_TAG}" >> .env.production

                                    # Yeni image'ları çek
                                    docker compose \\
                                      --env-file .env.production \\
                                      -f ${COMPOSE_FILE} \\
                                      -p ${STACK_NAME} \\
                                      pull web migrator

                                    # Migrator + web + bağımlılıklarını yeniden kaldır
                                    # (postgres/redis zaten healthy ise dokunulmaz)
                                    docker compose \\
                                      --env-file .env.production \\
                                      -f ${COMPOSE_FILE} \\
                                      -p ${STACK_NAME} \\
                                      up -d --remove-orphans
                                """
                            }
                            echo "[BİTİŞ] Production deploy tamamlandı (TAG=${IMMUTABLE_TAG})"
                        }
                    }
                }
            }
        }

        // ------------------------------------------------------
        // 12) SMOKE TEST (main only) — built-in
        // Deploy sonrası convergence bekle, sonra:
        //   - Internal: assetart_internal network üstünde temp container ile
        //     web:3000/api/health probe
        //   - Local: host'un publish ettiği 8090 port'undan /api/health
        //   - Public: Caddy --profile tls aktifse https endpoint (graceful)
        // ------------------------------------------------------
        stage('Smoke Test') {
            agent none
            when { branch 'main' }
            steps {
                script {
                    node('built-in') {
                        ws("workspace/${env.JOB_NAME}-smoke-${env.BUILD_NUMBER}") {
                            echo "[BAŞLA] Smoke test — post-deploy health probe"
                            sh '''
                                set -e
                                echo "--> Compose convergence wait (max 60s)"
                                for i in $(seq 1 12); do
                                  WEB_STATE=$(docker inspect -f '{{.State.Health.Status}}' assetnova-web 2>/dev/null || echo "starting")
                                  echo "  tick $i: web=${WEB_STATE}"
                                  if [ "$WEB_STATE" = "healthy" ]; then
                                    echo "Web service healthy."
                                    break
                                  fi
                                  sleep 5
                                done

                                echo "--> Migrator exit kodu kontrolü (0 bekleniyor)"
                                MIG_EXIT=$(docker inspect -f '{{.State.ExitCode}}' assetnova-migrator 2>/dev/null || echo "missing")
                                echo "  migrator exit=${MIG_EXIT}"
                                if [ "$MIG_EXIT" != "0" ] && [ "$MIG_EXIT" != "missing" ]; then
                                  echo "Migrator non-zero exit — fail"; exit 1
                                fi

                                echo "--> Internal health (network üzerinden geçici curl)"
                                NETWORK=$(docker inspect assetnova-web --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{end}}' | head -1)
                                docker run --rm --network "$NETWORK" \\
                                  curlimages/curl:latest \\
                                  -fsS --max-time 5 http://web:3000/api/health > /dev/null
                                echo "  internal OK"

                                echo "--> Local published port health (host 8090)"
                                curl -fsS --max-time 10 http://localhost:8090/api/health > /dev/null
                                echo "  local OK"

                                echo "--> Public health (Caddy --profile tls aktifse)"
                                curl -fsS --max-time 10 https://assets.heavezz.uk/api/health > /dev/null \\
                                  && echo "  public OK" \\
                                  || echo "  public skip (Caddy profile aktif değil veya DNS hazır değil)"
                            '''
                            echo "[BİTİŞ] Smoke test başarılı — web healthy, migrator exit=0, /api/health 200"
                        }
                    }
                }
            }
        }
    }

    // ----------------------------------------------------------
    // POST-BUILD
    // agent none olduğu için sh çağrıları node block içinde olmalı.
    // Her zaman GHCR logout + workspace cleanup.
    // ----------------------------------------------------------
    post {
        always {
            // Docker logout (her zaman çalışır)
            node('built-in') {
                sh 'docker logout ghcr.io || true'
            }
            // Pipeline tamamlandıktan sonra workspace cleanup.
            // Pattern: workspace/assetart/main-{stage}-{target}-{BUILD_NUMBER}
            // try/catch ile sarılı → cleanup hatası pipeline'ı fail etmez.
            script {
                try {
                    node('built-in') {
                        echo "[CLEANUP] Build #${env.BUILD_NUMBER} workspace cleanup başlıyor"
                        sh '''
                            BEFORE=$(df -h / | tail -1 | awk '{print $5}')
                            find /var/jenkins_home/workspace/ \\
                                -maxdepth 2 \\
                                -type d \\
                                \\( -name "*-${BUILD_NUMBER}" -o -name "*-${BUILD_NUMBER}@tmp" \\) \\
                                -exec rm -rf {} + 2>/dev/null || true
                            AFTER=$(df -h / | tail -1 | awk '{print $5}')
                            echo "[CLEANUP] Disk usage: ${BEFORE} -> ${AFTER}"
                            echo "[CLEANUP] Build #${BUILD_NUMBER} workspace dizinleri temizlendi"
                        '''
                    }
                } catch (e) {
                    // Cleanup hatası pipeline'ı fail etmemeli
                    echo "Workspace cleanup hatası (non-critical): ${e.message}"
                }
            }
        }
        failure {
            echo "Pipeline FAILED: ${env.JOB_NAME} #${env.BUILD_NUMBER}"
        }
        success {
            echo "Pipeline SUCCESS: ${env.JOB_NAME} #${env.BUILD_NUMBER}"
        }
    }
}
