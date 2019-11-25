from puppet import Puppet
from userprofile import profile_dir


BINARY = "C:\\Program Files\\Mozilla Firefox\\firefox.exe"


def __execute():
    profile = profile_dir()
    if profile is None:
        return

    with Puppet(BINARY, profile) as puppet:
        if not puppet.has_session:
            return

        GOOGLE = "https://www.google.co.jp/"
        puppet.marionette.navigate(GOOGLE)

        puppet.wait(3)

        inp = puppet.query_selector(
            "#tsf > div:nth-child(2) > div.A8SBwf > div.RNNXgb > div > div.a4bIc > input")

        inp.send_keys(list("cat"))

        puppet.wait(2)

        tgt = puppet.query_selector(
            "#tsf > div:nth-child(2) > div.A8SBwf > div.FPdoLc.tfB0Bf > center > input.gNO89b")
        tgt.click()

        puppet.wait(15)

        print("done")


if __name__ == "__main__":
    __execute()
