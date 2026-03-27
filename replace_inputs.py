import re

with open('member.html', 'r') as f:
    content = f.read()

# Current replace block we need to replace
search = """                             <div>
                                <label class="block text-[9px] uppercase text-gray-400 mb-1 font-bold">Techs</label>
                                <input type="number" list="techs-list" id="c-techs" class="w-full text-center bg-slate-900 border border-gray-700 p-2 rounded text-white" value="1">
                                <datalist id="techs-list">
"""

# Let's just do a string replace for the whole section to make it simple.
# Read up to the end of rate-list
# A simpler way is to just do it with regex.

pattern = re.compile(r'                             <div>\n                                <label class="block text-\[9px\] uppercase text-gray-400 mb-1 font-bold">Techs</label>.*?</div>\n                             <div>\n                                <label class="block text-\[9px\] uppercase text-gray-400 mb-1 font-bold">Hours</label>.*?</div>\n                             <div>\n                                <label class="block text-\[9px\] uppercase text-gray-400 mb-1 font-bold">Rate/Hr</label>.*?</div>', re.DOTALL)

techs_options = "\n".join([f'                                    <option value="{i}"></option>' for i in range(1, 21)])
hours_options = "\n".join([f'                                    <option value="{i}"></option>' for i in range(1, 51)])
rate_options = "\n".join([f'                                    <option value="{i}"></option>' for i in range(10, 50, 5)])

replace = f"""                             <div>
                                <label class="block text-[9px] uppercase text-gray-400 mb-1 font-bold">Techs</label>
                                <input type="number" list="techs-list" id="c-techs" class="w-full text-center bg-slate-900 border border-gray-700 p-2 rounded text-white" value="1">
                                <datalist id="techs-list">
{techs_options}
                                </datalist>
                             </div>
                             <div>
                                <label class="block text-[9px] uppercase text-gray-400 mb-1 font-bold">Hours</label>
                                <input type="number" list="hours-list" id="c-hours" class="w-full text-center bg-slate-900 border border-gray-700 p-2 rounded text-white" value="0">
                                <datalist id="hours-list">
{hours_options}
                                </datalist>
                             </div>
                             <div>
                                <label class="block text-[9px] uppercase text-gray-400 mb-1 font-bold">Rate/Hr</label>
                                <input type="number" list="rate-list" id="c-rate" class="w-full text-right bg-slate-900 border border-gray-700 p-2 rounded text-white" value="45">
                                <datalist id="rate-list">
{rate_options}
                                </datalist>
                             </div>"""

new_content, count = pattern.subn(replace, content)
if count > 0:
    with open('member.html', 'w') as f:
        f.write(new_content)
    print("Success")
else:
    print("Pattern not found")
