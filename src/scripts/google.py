GOOGLE = "https://www.google.co.jp/"

mrnt.navigate(GOOGLE)

wait(3)

inp = query_selector(
    "#tsf > div:nth-child(2) > div.A8SBwf > div.RNNXgb > div > div.a4bIc > input")

inp.send_keys(list("cat"))

wait(2)

tgt = query_selector(
    "#tsf > div:nth-child(2) > div.A8SBwf > div.FPdoLc.tfB0Bf > center > input.gNO89b")
tgt.click()

wait(15)

print("done")
