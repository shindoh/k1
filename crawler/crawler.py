# -*- coding: utf8 -*-
from bs4 import BeautifulSoup
import requests
import re
import json


def strip_prop(prop_str):
    if prop_str is None:
        return None
    return re.sub('[\t\n\r]', '', prop_str.strip())


def fetch_member_academic_career(member_id, member_name):
    url = 'http://people.search.naver.com/search.naver'
    payload = {
        'ie': 'utf8',
        'where': 'nexearch',
        'query': '국회의원 %s' % member_name
    }
    page = requests.get(url, params=payload)
    m = re.search('oAPIResponse\s:(.+?),\ssAPIURL', page.text)

    js_data = json.loads(m.group(1))
    js_item_list = js_data['data']['result']['itemList']

    item_length = len(js_item_list)
    print('__debug__ member %d has %d result(s)' % (member_id, item_length))

    matched_data = js_item_list[0]
    return matched_data['school']


def fetch_member_basic_prop(member_id):
    MEMBER_BASIC_PROP_URL = 'http://www.assembly.go.kr/assm/memPop/memPopup.do?dept_cd=%d'
    page = requests.get(MEMBER_BASIC_PROP_URL % member_id)
    soup = BeautifulSoup(page.text, 'html.parser')

    detail_dl = soup.find('dl', class_='pro_detail')
    details_dd = detail_dl.find_all('dd')
    prop = {
        'party': strip_prop(details_dd[0].string),
        'committee': list(map(lambda x: strip_prop(x), details_dd[2].string.split(','))),
        'website': strip_prop(details_dd[5].string),
        'email': strip_prop(details_dd[6].string)
    }
    return prop


def fetch_all_members():
    url = 'http://www.assembly.go.kr/assm/memact/congressman/memCond/memCondListAjax.do'
    payload = {
        'currentPage': '1',
        'rowPerPage': '300'
    }
    page = requests.post(url, data=payload)
    soup = BeautifulSoup(page.text, 'html.parser')

    members_dl = soup.find('div', class_='memberna_list').find_all('dl')
    members = []

    for member_dl in members_dl:
        match = re.search('([0-9]+)', member_dl.a.attrs['href'])
        member_name = member_dl.a.string
        member_id = int(match.group(0))
        member = {
            'name': member_name,
            'local': member_dl.find('dd', class_='ht').string,
            'id': member_id,
            'basic_prop': fetch_member_basic_prop(member_id),
            'academic_career': fetch_member_academic_career(member_id, member_name)
        }
        members.append(member)
        print('%d done' % len(members))
    return members

if __name__ == '__main__':
    members = fetch_all_members()
    with open('result.txt', 'w', encoding='utf8') as f:
        f.write(json.dumps(members, ensure_ascii=False))
