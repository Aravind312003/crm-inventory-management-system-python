#!/bin/bash
echo "Starting backend setup..." > startup_log.txt
# Try to install requirements using whatever pip is available
PIP_CMD="pip"
if command -v pip3 &> /dev/null; then
    PIP_CMD="pip3"
elif python3 -m pip --version &> /dev/null; then
    PIP_CMD="python3 -m pip"
elif python -m pip --version &> /dev/null; then
    PIP_CMD="python -m pip"
fi

echo "Using pip command: $PIP_CMD" >> startup_log.txt
$PIP_CMD install -r backend/requirements.txt >> startup_log.txt 2>&1

# Figure out python command
PY_CMD="python3"
if ! command -v python3 &> /dev/null; then
    PY_CMD="python"
fi

echo "Using python command: $PY_CMD" >> startup_log.txt
export PYTHONPATH=$PYTHONPATH:.
$PY_CMD -m uvicorn backend.main:app --host 0.0.0.0 --port 3000 >> startup_log.txt 2>&1
