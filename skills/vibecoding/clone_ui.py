#!/usr/bin/env python3
import json,sys

if __name__ == "__main__":
    payload={"skill":"clone_ui","category":"vibecoding","args":sys.argv[1:]}
    print(json.dumps(payload))
