curl -d '{"code":"$2"}' -H "Content-Type: application/json" -X POST http://${1}:5000/leaderIsGone | awk ' FNR == 1 {print $1}'