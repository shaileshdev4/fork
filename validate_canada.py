# Validate Canada tax model (2025) for a single individual, against published calculators.
# Federal blended 14.5% lowest bracket (Bill C-4), BPA $16,129.
# Provincial: Ontario & BC (the two most relevant for relocation).
# CPP/EI: 2025 rates.

FED = [(57375,0.145),(114750,0.205),(177882,0.26),(253414,0.29),(float('inf'),0.33)]
FED_BPA = 16129

PROV = {
 "ON": {"name":"Ontario","bpa":12747,
        "brackets":[(52886,0.0505),(105775,0.0915),(150000,0.1116),(220000,0.1216),(float('inf'),0.1316)],
        "surtax":[(5710,0.20),(7307,0.36)]},  # Ontario surtax thresholds (tax-on-tax)
 "BC": {"name":"British Columbia","bpa":12932,
        "brackets":[(49279,0.0506),(98560,0.077),(113158,0.105),(137407,0.1229),(186306,0.147),(259829,0.168),(float('inf'),0.205)],
        "surtax":[]},
}

# CPP 2025: rate 5.95% on (pensionable earnings up to YMPE 71300, minus basic exemption 3500). CPP2: 4% between 71300 and 81200.
CPP_RATE=0.0595; YMPE=71300; CPP_EXEMPT=3500
CPP2_RATE=0.04; YAMPE=81200
# EI 2025: 1.64% up to max insurable 65700
EI_RATE=0.0164; EI_MAX=65700

def bracket_tax(income, brackets):
    tax=0; low=0
    for cap,rate in brackets:
        if income>low:
            tax+=(min(income,cap)-low)*rate; low=cap
        else: break
    return tax

def fed_tax(income):
    t=bracket_tax(income,FED)
    credit=FED_BPA*0.145  # BPA credited at lowest rate
    return max(0,t-credit)

def prov_tax(income,prov):
    p=PROV[prov]
    base=bracket_tax(income,p["brackets"])
    credit=p["bpa"]*p["brackets"][0][1]
    base=max(0,base-credit)
    # Ontario surtax: tax on tax above thresholds
    surtax=0
    for thresh,rate in p.get("surtax",[]):
        if base>thresh: surtax+=(base-thresh)*rate
    return base+surtax

def cpp(income):
    pens=max(0,min(income,YMPE)-CPP_EXEMPT)*CPP_RATE
    cpp2=max(0,min(income,YAMPE)-YMPE)*CPP2_RATE
    return pens+cpp2

def ei(income):
    return min(income,EI_MAX)*EI_RATE

def net(income,prov):
    f=fed_tax(income); p=prov_tax(income,prov); c=cpp(income); e=ei(income)
    total=f+p+c+e
    return dict(gross=income,fed=f,prov=p,cpp=c,ei=e,total=total,net=income-total,
                net_mo=(income-total)/12, eff=total/income)

for prov in ["ON","BC"]:
    for inc in [85000,130000]:
        r=net(inc,prov)
        print(f"{PROV[prov]['name']:18} ${inc:,}: fed ${r['fed']:,.0f} prov ${r['prov']:,.0f} "
              f"CPP ${r['cpp']:,.0f} EI ${r['ei']:,.0f} | total ${r['total']:,.0f} "
              f"({r['eff']*100:.1f}%) net/mo ${r['net_mo']:,.0f}")
