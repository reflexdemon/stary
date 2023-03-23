#!/usr/bin/env bash

# Ensure you are in main
git checkout main

# Ensure you are doing a pull
git pull

# Deploy changes
ng deploy --base-href=https://star.vpv.io/