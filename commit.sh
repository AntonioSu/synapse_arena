#!/bin/bash

# 快速提交脚本
# 用法: ./commit.sh "提交信息"

if [ -z "$1" ]; then
    echo "用法: ./commit.sh \"提交信息\""
    exit 1
fi

cd "$(dirname "$0")" || exit 1

git add .
git commit -m "$1"
git push origin wip-work
