#!/usr/bin/env python3
import json,sys

if __name__ == "__main__":
    payload={"skill":"animate","category":"vibecoding","args":sys.argv[1:]}
    print(json.dumps(payload))
