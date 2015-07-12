# -*- coding: utf8 -*-
from bs4 import BeautifulSoup
import requests
import re
import json
from time import sleep


def strip_prop(prop_str):
    if prop_str is None:
        return None
    return re.sub('[\t\n\r]', '', prop_str.strip())


def query_naver_people_search(query):
    url = 'http://people.search.naver.com/search.naver'
    payload = {
        'ie': 'utf8',
        'where': 'nexearch',
        'query': query
    }
    page = requests.get(url, params=payload)
    m = re.search('oAPIResponse\s:(.+?),\ssAPIURL', page.text)

    if m is None:
        return None

    js_data = json.loads(m.group(1))
    item_list = js_data['data']['result']['itemList']
    return item_list


def fetch_member_academic_career(member_id, member_name):
    able_querys = ['국회의원 %s' % member_name, '%s 국회의원' % member_name,
                   '%s 의원' % member_name]
    item_list = None
    for query in able_querys:
        item_list = query_naver_people_search(query)
        if item_list is not None:
            break

    if item_list is None:
        raise Exception('no academic data')

    item_length = len(item_list)
    print('__debug__ member %d has %d result(s)' % (member_id, item_length))

    matched_data = item_list[0]
    return matched_data['school']


def fetch_member_basic_prop(member_id):
    url = 'http://www.assembly.go.kr/assm/memPop/memPopup.do'
    payload = {
        'dept_cd': str(member_id)
    }
    page = requests.get(url, params=payload)
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
        sleep(2)
    return members

if __name__ == '__main__':
    members = fetch_all_members()
    with open('result.txt', 'w', encoding='utf8') as f:
        f.write(json.dumps(members, ensure_ascii=False))
