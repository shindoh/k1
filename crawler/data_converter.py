import json
import crawler

with open('dump.txt', 'r', encoding='utf8') as f:
    raw_data = f.read()
    data = json.loads(raw_data)

    converted = []
    for member_data in data:
        committes = member_data['basic_prop']['committee']
        prop_committes = [c.replace(' ', '') for c in committes]
        if len(prop_committes) == 1:
            prop_committes = prop_committes[0]
        properties = [{
            'type': '위원회',
            'name': prop_committes
        }]
        properties.extend(crawler.extract_props_from_naver_school_career(member_data['academic_career']))

        conv_data = {
            'id': member_data['id'],
            'name': member_data['name'],
            'website': member_data['basic_prop']['website'],
            'email': member_data['basic_prop']['email'],
            'party': member_data['basic_prop']['party'],
            'local': member_data['local'],
            'properties': properties
        }
        converted.append(conv_data)

    with open('converted.txt', 'w') as cf:
        cf.write(json.dumps(converted, ensure_ascii=False))