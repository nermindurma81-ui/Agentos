#!/usr/bin/env python3
import json,sys

if __name__ == "__main__":
    payload={"skill":"form_ux","category":"uiux","args":sys.argv[1:]}
    print(json.dumps(payload))
