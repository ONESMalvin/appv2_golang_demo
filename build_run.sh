#cd web && npm run build && cd .. && go build && ./appv2go

concurrently "cd web && npm run dev" "go build && ./appv2go" " ones_appv2_local_agent -s https://p8205-k3s-9.k3s-dev.myones.net -a app_f63grnbjr6xinlyk -t testmyrelaytoken -p 8082"